import { sh1, s2b, b2s, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.l || !args.s) {
    echo("$ ppc -s 1.2.3.4:7777");
    echo("$ ppc -l 5.6.7.8:4444 -s 1.2.3.4:7777 -c 3");
    echo("");
    echo("    note: -l local listen address used by UDP, default is 0.0.0.0:0");
    echo("");
    echo("v20220621");
    Deno.exit(0);
}
if (!/\d+\.\d+\.\d+\.\d+:\d+/.test(args.s) && !args.s.startsWith("[")) {
    if (Deno.build.os != "windows") {
        args.s = joinhostport((await sh1(`dig +tcp -t A +short ${splithostport(args.s)[0]} @8.8.8.8`)).trim(), splithostport(args.s)[1]);
    }
    if (Deno.build.os == "windows") {
        var s = await sh1(`nslookup -vc -type=A ${splithostport(args.s)[0]} 8.8.8.8`);
        var l = s.split("\n");
        for (var i = l.length - 1; i >= 0; i--) {
            if (l[i].startsWith(s.indexOf("Addresses") != -1 ? "Addresses:" : "Address:")) {
                args.s = joinhostport(l[i].replace(s.indexOf("Addresses") != -1 ? "Addresses:" : "Address:", "").trim(), splithostport(args.s)[1]);
                break;
            }
        }
    }
    echo(`DNS: ${args.s}`);
}
var n = 1;
if (args.c) {
    n = parseInt(args.c);
}

var b = new Uint8Array(23);

var conn = await Deno.connect({ hostname: splithostport(args.s)[0], port: splithostport(args.s)[1], transport: "tcp" });
for (var j = 0; j < n; j++) {
    var i = await conn.write(s2b(joinhostport(conn.localAddr.hostname, conn.localAddr.port)));
    var i = await conn.read(b);
    if (joinhostport(conn.localAddr.hostname, conn.localAddr.port) == b2s(b.slice(0, i))) {
        echo(`TCP: src:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} -> dst:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
        echo(`TCP: dst:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} <- src:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
    }
    if (joinhostport(conn.localAddr.hostname, conn.localAddr.port) != b2s(b.slice(0, i))) {
        echo(`TCP: src:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} -> dst:proxy -> src:proxy -> dst:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
        echo(`TCP: dst:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} <- src:proxy <- dst:${b2s(b.slice(0, i))} <- src:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
    }
}
conn.close();

var c;
if (args.l) {
    c = Deno.listenDatagram({ hostname: splithostport(args.l)[0], port: splithostport(args.l)[1], transport: "udp" });
}
if (!args.l) {
    for (var p = 7777; true; p++) {
        try {
            c = Deno.listenDatagram({ hostname: "0.0.0.0", port: p, transport: "udp" });
            break;
        } catch (e) {
            if (`${e}`.indexOf("Address already in use")) {
                continue;
            }
            throw e;
        }
    }
}
for (var i = 0; i < n; i++) {
    await c.send(s2b(joinhostport(c.addr.hostname, c.addr.port)), { transport: "udp", hostname: splithostport(args.s)[0], port: parseInt(splithostport(args.s)[1]) });
    var l = await c.receive(b);
    if (joinhostport(c.addr.hostname, c.addr.port) == b2s(l[0])) {
        echo(`UDP: src:${joinhostport(c.addr.hostname, c.addr.port)} -> dst:${args.s}`);
        echo(`UDP: dst:${joinhostport(c.addr.hostname, c.addr.port)} <- src:${joinhostport(l[1].hostname, l[1].port)}`);
    }
    if (joinhostport(c.addr.hostname, c.addr.port) != b2s(l[0])) {
        echo(`UDP: src:${joinhostport(c.addr.hostname, c.addr.port)} -> dst:proxy -> src:proxy -> dst:${args.s}`);
        echo(`UDP: dst:${joinhostport(c.addr.hostname, c.addr.port)} <- src:proxy <- dst:${b2s(l[0])} <- src:${joinhostport(l[1].hostname, l[1].port)}`);
    }
}
c.close();
