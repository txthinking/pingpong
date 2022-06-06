import { sh1, s2b, b2s, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.s) {
    echo("$ ppc -s 1.2.3.4:7777");
    echo("$ ppc -s 1.2.3.4:7777 -c 3");
    echo("");
    echo("v20220606");
    Deno.exit(0);
}
if (!/\d+\.\d+\.\d+\.\d+:\d+/.test(args.s) && !args.s.startsWith("[")) {
    if (Deno.build.os != "windows") {
        args.s = joinhostport((await sh1(`dig +tcp +short ${splithostport(args.s)[0]} @8.8.8.8`)).trim(), splithostport(args.s)[1]);
    }
    if (Deno.build.os == "windows") {
        var s = await sh1(`nslookup -vc ${splithostport(args.s)[0]} 8.8.8.8`);
        var l = s.split("\n");
        for (var i = l.length - 1; i >= 0; i--) {
            if (l[i].startsWith(s.indexOf("Addresses") != -1 ? "Addresses:" : "Address:")) {
                args.s = joinhostport(l[i].replace(s.indexOf("Addresses") != -1 ? "Addresses:" : "Address:", "").trim(), splithostport(args.s)[1]);
                break;
            }
        }
    }
    echo(`dns ${args.s}`);
}
var n = 1;
if (args.c) {
    n = parseInt(args.c);
}

var data = new Uint8Array([231, 155, 184, 230, 175, 148, 228, 186, 142, 65, 110, 100, 114, 111, 105, 100, 239, 188, 140, 229, 188, 128, 229, 143, 145, 105, 79, 83, 229, 186, 148, 231, 148, 168, 229, 174, 161, 230, 160, 184, 231, 156, 159, 230, 152, 175, 229, 138, 179, 229, 191, 131, 232, 180, 185, 231, 165, 158, 239, 188, 140, 229, 191, 131, 231, 180, 175, 239, 188, 129]);

var c = Deno.listenDatagram({ hostname: splithostport(args.l)[0], port: splithostport(args.l)[1], transport: "udp" });
for (var i = 0; i < n; i++) {
    await c.send(data, { transport: "udp", hostname: splithostport(args.s)[0], port: parseInt(splithostport(args.s)[1]) });
    echo(`udp src: ${joinhostport(c.addr.hostname, c.addr.port)} dst: ${args.s} data: ${b2s(data)}`);
    var b = new Uint8Array(23);
    var l = await c.receive(b);
    echo(`udp src: ${joinhostport(l[1].hostname, l[1].port)} dst: ${joinhostport(c.addr.hostname, c.addr.port)} data: ${b2s(l[0])}`);
}
c.close();

var conn = await Deno.connect({ hostname: splithostport(args.s)[0], port: splithostport(args.s)[1], transport: "tcp" });
var b = new Uint8Array(23);
for (var j = 0; j < n; j++) {
    var i = await conn.write(data);
    echo(`tcp src: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} dst: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} data: ${b2s(data)}`);
    var i = await conn.read(b);
    echo(`tcp src: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} dst: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} data: ${b2s(b.slice(0, i))}`);
}
conn.close();
