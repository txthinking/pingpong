# pingpong

TCP & UDP echo but with address

Install via [nami](https://github.com/txthinking/nami)

```
nami install pingpong
```

Server

```
pps -l 0.0.0.0:7777
```

Client

```
ppc -p udp -l 0.0.0.0:7777 -s 1.2.3.4:7777
ppc -p udp -l 0.0.0.0:7777 -s 1.2.3.4:7777 -c 3
ppc -p tcp -s 1.2.3.4:7777
ppc -p tcp -s 1.2.3.4:7777 -c 3
```
