# cpp-check-lint README

Support cppcheck and cpplint

## Features

 * cppcheck/cpplint:
    * editor/context      
        * check current file    
        * check the directory of the current file    
        * cmd :    
            * clear all    
            * clear current file    
            * stop check    
    * explorer/context
        * check directory || check current file
        * cmd  
    * OnSave/QuickFix

## Requirements

* cpplint : https://github.com/cpplint/cpplint

* cppcheck : https://sourceforge.net/p/cppcheck/wiki/Home/

## Extension Settings

 * Executable file selection logic    
 ``` 
    
    if (cppcheck configure is null) {
        use builtin binaries
    } else {
        if( ("path to executable" --version).trim().toLowerCase().startsWith("cppcheck") ){
            use "path to executable"
        } else {
           use builtin binaries 
        }
    }

    if (cpplint configure is null) {
        use builtin binaries
    } else {
        if("path to executable"){
            use "path to executable"
        } else {
           use builtin binaries 
        }
    } 
```

* cpplint dir

   cpplint version need support "--recursive"

* OnSave

    suggest use with clang-format

* QuickFix

    It's just suppresses alarms

* Configure
    > skip flag
    >> | type | value | 
    >> |:----:|:-----:|
    >> |bool|false|
    >> |string|""|
    >> |number|null|
    >> |object|null|

* builtin binaries(cppcheck 2.4.1, cpplint 1.5.4)
    > support  
    >> | Os | Bit | Version | 
    >> |:--:|:---:|:--------|
    >> |Ubuntu|64|16.04+|
    >> |Debian|64|9+|
    >> |CentOS|64|7+|
    >> |RHEL|64|7+|
    >> |Windows|64|7+|

## Known Issues

* cpp-check-lint https://github.com/QiuminGe/cpp-check-lint/issues

* cpplint : https://github.com/cpplint/cpplint/issues

* cppcheck : https://sourceforge.net/p/cppcheck/wiki/Home/

## Source code 

* https://github.com/QiuminGe/cpp-check-lint

## Release Notes

* CHANGELOG.md
-----------------------------------------------------------------------------------------------------------

