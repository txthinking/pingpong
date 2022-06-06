import { s2b, b2s, joinhostport, splithostport, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.l) {
    echo("$ pps -l 0.0.0.0:7777 ");
    echo("");
    echo("v20220606");
    Deno.exit(0);
}

(async () => {
    var c = Deno.listenDatagram({ hostname: splithostport(args.l)[0], port: parseInt(splithostport(args.l)[1]), transport: "udp" });
    var b = new Uint8Array(100);
    for (;;) {
        var l = await c.receive(b);
        echo(`udp\t\tsrc: ${joinhostport(l[1].hostname, l[1].port)}\t\tdst: ${joinhostport(c.addr.hostname, c.addr.port)}\t\tdata: ${b2s(l[0])}`);
        await c.send(s2b(joinhostport(l[1].hostname, l[1].port)), l[1]);
        echo(`udp\t\tsrc: ${joinhostport(c.addr.hostname, c.addr.port)}\t\tdst: ${joinhostport(l[1].hostname, l[1].port)}\t\tdata: ${joinhostport(l[1].hostname, l[1].port)}`);
    }
})();

var c1 = Deno.listen({ hostname: splithostport(args.l)[0], port: parseInt(splithostport(args.l)[1]), transport: "tcp" });
for (;;) {
    const conn = await c1.accept();
    (async (conn) => {
        var b = new Uint8Array(100);
        for (;;) {
            var i = await conn.read(b);
            if (i === null) {
                return;
            }
            echo(`tcp\t\tsrc: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}\t\tdst: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)}\t\tdata: ${b2s(b.slice(0, i))}`);
            var i = await conn.write(s2b(joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)));
            echo(`tcp\t\tsrc: ${joinhostport(conn.localAddr.hostname, conn.localAddr.port)}\t\tdst: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}\t\tdata: ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
        }
    })(conn);
}
