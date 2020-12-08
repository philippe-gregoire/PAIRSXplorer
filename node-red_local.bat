SETLOCAL
call c:\phg\utils\nodevars.bat
call %~dp0..\PAIRSVitiView\PAIRSVitiView\curl\setPAIRSCreds.bat
start node-red -u %~dp0.node-red
ENDLOCAL