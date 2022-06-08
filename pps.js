import { s2b, b2s, joinhostport, splithostport, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.p) {
    echo("$ pps -p 7777 ");
    echo("");
    echo("v20220608");
    Deno.exit(0);
}

(async () => {
    var c = Deno.listenDatagram({ hostname: "0.0.0.0", port: parseInt(args.p), transport: "udp" });
    var b = new Uint8Array(100);
    for (;;) {
        var l = await c.receive(b);
        echo(`< UDP ${joinhostport(l[1].hostname, l[1].port)} ${b2s(l[0])}`);
        await c.send(s2b(joinhostport(l[1].hostname, l[1].port)), l[1]);
        echo(`> UDP ${joinhostport(l[1].hostname, l[1].port)} ${joinhostport(l[1].hostname, l[1].port)}`);
    }
})();

var c1 = Deno.listen({ hostname: "0.0.0.0", port: parseInt(args.p), transport: "tcp" });
for (;;) {
    try {
        const conn = await c1.accept();
    } catch (e) {
        echo(`deno bug?: ${e}`);
        continue;
    }
    (async (conn) => {
        var b = new Uint8Array(100);
        for (;;) {
            var i = await conn.read(b);
            if (i === null) {
                conn.close();
                return;
            }
            echo(`< TCP ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} ${b2s(b.slice(0, i))}`);
            var i = await conn.write(s2b(joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)));
            echo(`> TCP ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} ${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
        }
    })(conn);
}
