import { sh1, s2b, b2s, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.s) {
    echo("$ ppc -s 1.2.3.4:7777");
    echo("$ ppc -s 1.2.3.4:7777 -c 3");
    echo("");
    echo("v20220617");
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
    echo(`TCP: src:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} -> dst:proxy -> src:proxy -> dst:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
    var i = await conn.read(b);
    echo(`TCP: dst:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} <- src:proxy <- dst:${b2s(b.slice(0, i))} <- src:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
}
conn.close();

var c;
for (var p = 7777; true; p++) {
    try {
        c = Deno.listenDatagram({ hostname: "0.0.0.0", port: p, transport: "udp" });
        break;
    } catch (e) {
        if (`${e}`.indexOf("Address already in use")) {
            echo(e);
            continue;
        }
        throw e;
    }
}
for (var i = 0; i < n; i++) {
    await c.send(s2b(joinhostport(c.addr.hostname, c.addr.port)), { transport: "udp", hostname: splithostport(args.s)[0], port: parseInt(splithostport(args.s)[1]) });
    echo(`UDP: src:${joinhostport(c.addr.hostname, c.addr.port)} -> dst:proxy -> src:proxy -> dst:${args.s}`);
    var l = await c.receive(b);
    echo(`UDP: dst:${joinhostport(c.addr.hostname, c.addr.port)} <- src:proxy <- dst:${b2s(l[0])} <- src:${joinhostport(l[1].hostname, l[1].port)}`);
}
c.close();
