@REM Get info to setup a ssh or winscp ssh session with IBMCloud CF App
@REM See https://docs.cloudfoundry.org/devguide/deploy-apps/ssh-apps.html#other-ssh-access
@REM Parameters: [ssh|winscp] [AppName]
@REM if no app specified, the first running one of the current default space will be used
@SETLOCAL
@SET APP_NAME="Node RED PAIRS"
@REM FOR /F "skip=4 tokens=*" %%i in ('ibmcloud cf apps') do SET APP_NAME=%%i
@IF NOT '%2'=='' SET APP_NAME=%2
@IF NOT DEFINED @ SET @=@
@REM ============================================
@SET PATH=C:\Program Files\IBM\Cloud\bin;%PATH%
@SET IBMCLOUD_COLOR=false
@SET IBMCLOUD_VERSION_CHECK=false
@REM SET IBMCLOUD_TRACE=true
@REM ============================================
@REM call ic cf curl /v2/info
%@%for /F "delims=: tokens=2,3" %%i in ('@ibmcloud cf -q curl /v2/info ^|findstr app_ssh_endpoint') do %@%(SET SSH_HOST=%%i&SET SSH_PORT=%%j)
@REM %@%SET SSH_HOST=%SSH_HOST:, =%
%@%SET SSH_HOST=%SSH_HOST: "=%
%@%SET SSH_PORT=%SSH_PORT:",=%

%@%for /F %%i in ('@ibmcloud cf -q app %APP_NAME% --guid') do %@%SET APP_GUID=%%i

%@%for /F %%i in ('@ibmcloud cf -q ssh-code') do %@%SET SSH_CODE=%%i

@ECHO SSH Host: %SSH_HOST% SSH Port: %SSH_PORT% SSH User: %APP_GUID%/0 SSH password: %SSH_CODE%
@ECHO SSH Command: ssh -p %SSH_PORT% cf:%APP_GUID%/0@%SSH_HOST%
@IF '%1'=='ssh' ssh -p %SSH_PORT% cf:%APP_GUID%/0@%SSH_HOST%
@ECHO winscp scp://cf%%3A%APP_GUID%%%2F0:%SSH_CODE%@%SSH_HOST%:%SSH_PORT%/home/vcap/app/.node-red/uibuilder/uibuilder/src/
@IF '%1'=='winscp' winscp scp://cf%%3A%APP_GUID%%%2F0:%SSH_CODE%@%SSH_HOST%:%SSH_PORT%/home/vcap/app/.node-red/uibuilder/uibuilder/src/

@ENDLOCAL