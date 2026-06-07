import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { generateSlug } from '../utils/jwt';

export const configurePassport = () => {
  const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

  if (isGoogleConfigured) {
    passport.use(
      new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));

          let user = await User.findOne({ email });

          if (!user) {
            const name = profile.displayName || email.split('@')[0];
            user = await User.create({
              email,
              authProvider: 'google',
              role: 'athlete',
              isVerified: true,
              isApproved: true,
              needsRoleSelection: true,
            });
            await AthleteProfile.create({
              userId: user._id,
              fullName: name,
              photo: profile.photos?.[0]?.value,
              profileUrl: generateSlug(name),
            });
          } else {
            // Existing user logging in via Google: mark email as verified (Google verified it)
            // and flag for role selection if they never completed it.
            let changed = false;
            if (!user.isVerified) {
              user.isVerified = true;
              changed = true;
            }
            if (user.needsRoleSelection) {
              // already flagged — no change needed
            }
            if (changed) await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
  } else {
    console.log('[Passport] Google OAuth not configured - skipping strategy registration');
  }

  passport.serializeUser((user: Express.User, done) => done(null, user._id.toString()));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
