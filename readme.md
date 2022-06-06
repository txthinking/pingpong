# pingpong

TCP & UDP echo but with address

Install via [nami](https://github.com/txthinking/nami)

```
nami install pingpong
```

Server

```
pps -p 7777
```

Client

```
ppc -s 1.2.3.4:7777
ppc -s 1.2.3.4:7777 -c 3
```
