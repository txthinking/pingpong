# pingpong

TCP & UDP echo but with address

Install via [nami](https://github.com/txthinking/nami)

```
nami install pingpong
```

Server

```
pps -l :7777
pps -l 1.2.3.4:7777
```

Client

```
ppc -s 1.2.3.4:7777
ppc -s 1.2.3.4:7777 -c 3
```

> A public server `ipip.ooo:7777` provide by [@txthinking](https://github.com/txthinking)
