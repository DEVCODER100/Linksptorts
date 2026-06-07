@echo off
set ANDROID_HOME=C:\Users\himan\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
cd /d "C:\Users\himan\OneDrive\Desktop\LinkSports\Linksports App\mobile\LinksportsApp\android"
echo Building and installing debug APK...
call gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
if %ERRORLEVEL% EQU 0 (
    echo.
    echo APK installed successfully!
    echo.
    echo Setting up port forwarding so the app can reach the backend...
    adb reverse tcp:5000 tcp:5000
    adb reverse tcp:8081 tcp:8081
    echo Port forwarding set up: device:5000 -^> computer:5000
    echo.
    echo Starting app...
    adb shell am start -n com.linksportsapp/.MainActivity
) else (
    echo.
    echo Build FAILED with error code %ERRORLEVEL%
)
