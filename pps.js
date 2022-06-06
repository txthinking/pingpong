import { s2b, b2s, joinhostport, splithostport, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.p) {
    echo("$ pps -p 7777 ");
    echo("");
    echo("v20220606");
    Deno.exit(0);
}

(async () => {
    var c = Deno.listenDatagram({ hostname: "0.0.0.0", port: parseInt(args.p), transport: "udp" });
    var b = new Uint8Array(100);
    for (;;) {
        var l = await c.receive(b);
        echo(`udp src: ${joinhostport(l[1].hostname, l[1].port)} dst: ${joinhostport(c.addr.hostname, c.addr.port)} data: ${b2s(l[0])}`);
        await c.send(s2b(joinhostport(l[1].hostname, l[1].port)), l[1]);
        echo(`udp src: ${joinhostport(c.addr.hostname, c.addr.port)} dst: ${joinhostport(l[1].hostname, l[1].port)} data: ${joinhostport(l[1].hostname, l[1].port)}`);
    }
})();

var c1 = Deno.listen({ hostname: "0.0.0.0", port: parseInt(args.p), transport: "tcp" });
for (;;) {
    const conn = await c1.accept();
    (async (conn) => {
        var b = new Uint8Array(100);
        for (;;) {
            var i = await conn.read(b);
            if (i === null) {
                return;
            }
            echo(`tcp src: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} dst: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} data: ${b2s(b.slice(0, i))}`);
            var i = await conn.write(s2b(joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)));
            echo(`tcp src: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} dst: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} data: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
        }
    })(conn);
}
