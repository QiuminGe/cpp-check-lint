# cpp-check-lint

[![GitHub release](https://img.shields.io/github/release/QiuminGe/cpp-check-lint.svg?style=plastic)](https://github.com/QiuminGe/cpp-check-lint/releases)
[![GitHub license](https://img.shields.io/github/license/QiuminGe/cpp-check-lint.svg?style=plastic)](https://github.com/QiuminGe/cpp-check-lint/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/QiuminGe/cpp-check-lint?style=plastic)](https://github.com/QiuminGe/cpp-check-lint/stargazers)
[![GitHub fork](https://img.shields.io/github/forks/QiuminGe/cpp-check-lint.svg?style=plastic)](https://github.com/QiuminGe/cpp-check-lint/network/members)
[![GitHub issues](https://img.shields.io/github/issues/QiuminGe/cpp-check-lint.svg?style=plastic)](https://github.com/QiuminGe/cpp-check-lint/issues)

[toc]

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

### cppcheck

* Install from source

``` shell
# http://cppcheck.net/
yum install -y gcc gcc-c++ cmake
sudo tar -zxvf cppcheck-x.y.tar.gz
cd cppcheck-x.y/
mkdir build && cd build
cmake ..
make -j$(nproc)
```

* Install for yum/apt_get/brew :

``` shell
sudo apt-get install cppcheck
sudo yum install cppcheck
brew install cppcheck
```

* help

http://cppcheck.sourceforge.net/manual.html

### cpplint

* Install from source

``` shell
https://github.com/cpplint/cpplint
```

* Install from pip

``` shell
pip install cpplint
```

### builtin binaries

* cppcheck 2.15  Windows 64-bit (No XP support)  Linux x86 GLIBC 2.5

* cpplint 1.6.1 (**linux cpplint need python**)

|from|to||
|----|--|-|
|http://cppcheck.net/|cpp-check-lint\bin\linux64|cppcheck<br>addons<br>cfg<br>platforms|
|http://cppcheck.net/|cpp-check-lint\bin\win64|cppcheck.exe<br>cppcheck-core.dll<br>addons<br>cfg<br>platforms|
|https://github.com/cpplint/cpplint/tree/1.6.1|cpp-check-lint\bin\win64|cpplint.py -> cpplint.exe|
|https://github.com/cpplint/cpplint/tree/1.6.1|cpp-check-lint\bin\linux64|cpplint.py|

## Extension Settings

* If ${workspaceFolder} is included, it will be replaced.

### Cppcheck

* Cppcheck:--executable

``` c++
if (cppcheck configure is null) {
    use builtin binaries
} else {
    if( ("path to executable" --version).trim().toLowerCase().startsWith("cppcheck") ){
        use "path to executable"
    } else {
        use builtin binaries 
    }
}
```

* Cppcheck:--addon=

``` json
[
    "cert", 
    {
        "script": "misra.py", 
        "args": [
            "--rule-texts=/home/user/misra.txt"
        ]
    }, 
    "y2038.py", 
    "C:\\UsersAdministrator\\hreadsafety.json"
]
```

"addon" and "addon.py" will use addons folder under the same level folder as cppcheck . 

``` shell
[rorot@cpppcheck]$ tree | grep -E " cppcheck.exe| addons| misra.py| y2038.py| cert.py| threadsafety.py"
├── addons
│   ├── cert.py
│   ├── misra.py
│   ├── threadsafety.py
│   └── y2038.py
├── cppcheck.exe
```

Some addons need extra arguments. You can configure json or json file.

``` json
{
    "script": "misra.py",
    "args": [
        "--rule-texts=/home/user/misra.txt"
    ]
}
"--rule-texts=/home/user/misra.txt" (need absolute path, and use "/" or "\\" to split paths)
"args": ["--rule-texts=${workspaceFolder}/rule/misra.txt"] -> "args":["--rule-texts=D:/code/demo/rule/misra.txt"]}
```

### Cpplint

* Cpplint:--executable

``` c++
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

* Cpplint:--recursive

* Cpplint:--lintdir

``` c++
if ( cpplint version support "--recursive") {
        set --recursive true
    } else {
        set "--recursive" false
        set "--lintdir"
}
```

* customargs

    If the configuration parameters cannot be satisfied, use custom configuration "--customargs="

* OnSave

    cpplint suggest use with clang-format

* QuickFix

    It's just suppresses alarms

* Configure skip unsupported flag

    | type | value |
    |:----:|:-----:|
    |bool|false|
    |string|""|
    |number|null|
    |object|null|

## Known Issues

* cpp-check-lint https://github.com/QiuminGe/cpp-check-lint/issues

* cpplint : https://github.com/cpplint/cpplint/issues

* cppcheck : https://sourceforge.net/p/cppcheck/wiki/Home/

## Source code

* https://github.com/QiuminGe/cpp-check-lint


## [Release Notes](https://github.com/QiuminGe/cpp-check-lint/blob/main/CHANGELOG.md)

-----------------------------------------------------------------------------------------------------------
