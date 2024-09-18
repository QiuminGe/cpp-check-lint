# Change Log

All notable changes to the "cpp-checker" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Released]

- ~~v1.2.5~~  February 17, 2021 - Release for VS Code 1.53
- ~~v1.2.8~~ February 18, 2021 - replace v1.2.5
- ~~v1.3.0~~ February 23, 2021 - replace v1.2.8

## [v1.3.1] - 2021-03-05

- Fix Not used right click to activate the program, save invalid
- Fix Cppcheck is executed when saving non-C/C++ files
- Modify the description of [executable]
- Modify [Linux64] -> [linux64] 

## [v1.3.2] - 2021-03-08

- Fix Quick fixed for the same error in one line

## [v1.3.3] - 2021-04-01

- cppcheck show cwe id

## [v1.3.4] - 2021-04-06

- builtin binaries cppcheck update to 2.4.1
- optimization efficiency
- support set log level

## [v1.3.5] - 2021-04-07

- Adapt to low version cppcheck and cpplint

## [v1.3.6] - 2021-04-08

- make clear executable file selection logic
- update readme

## [v1.3.7] - 2021-04-09

- cpplint execution error is displayed on the output panel
- update readme
- cppcheck / cpplint support customargs
- cpplint lintdir param support cfg

## [v1.3.8] - 2021-04-09

- Update Readme

~~## [v1.3.9] - 2021-05-12~~    
~~### Changed~~    
~~- Update Readme~~    
~~- Fixed sonerqube check problem~~    
~~- cppcheck template argument add a single quote~~    
## [v1.4.0] - 2021-05-12

- replace [v1.3.9] 

## [v1.4.1] - 2021-05-14

- rollback "cppcheck template argument add a single quote"
- fixed cppckeck version less than 1.72 "template" is not supported "{column}", then Regular expression parsing failed.
- fixed some cppckeck version not support CWE-ID

## [v1.4.2] - 2021-05-24

- support addons

## [v1.4.3] - 2021-05-25

- addons path cfg

## [v1.4.4] - 2021-05-26

- modify addons readme

## [v1.4.5] - 2021-05-28

- modify readme
- cpplint update to v1.5.5

## [v1.4.6] - 2021-06-21

- update windows cpplint.exe (pyinstaller)
- The status bar shows the progress for cppcheck

## [v1.4.7] - 2021-10-21

- bug fixed -onsave isn't working

## [v1.4.8] - 2022-06-08

- option cppcheck.-I

## [v1.5.1] - 2023.11.20

- bug fixed --std_c miss c99 
- cpplint update to v2.12.0
- cppcheck update to v1.5.5

## [v1.5.2] - 2024.09.13

- Add support for cppcheck premium
- cpplint update to v2.15.0
- cppcheck update to v1.6.1

## [v1.5.3] - 2024.09.17

- Add support ${worspaceFolder}

## [v1.5.4] - 2024.09.17

- up readme

## [v1.5.5] - 2024.09.17

- misra.py addon not working correctly
