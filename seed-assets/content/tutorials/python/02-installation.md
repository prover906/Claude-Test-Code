## Windows

1. Download the installer from [python.org](https://www.python.org/downloads/).
2. Run it and **tick "Add python.exe to PATH"**.
3. Click *Install Now*.

## macOS

Use the official installer from python.org, or Homebrew:

```bash
brew install python
```

## Linux

Most distributions already include Python 3. If not:

```bash
sudo apt install python3 python3-pip   # Debian / Ubuntu
sudo dnf install python3               # Fedora
```

## Check the installation

```bash
python --version
```

On macOS and Linux you may need `python3 --version`.

## The interactive shell

Type `python` in a terminal to open the REPL, where you can run code line by line:

```text
>>> 2 + 3
5
>>> "py" * 3
'pypypy'
>>> exit()
```
