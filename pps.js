import { s2b, b2s, joinhostport, splithostport, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";

var args = parse(Deno.args);
if (args.h || args.help || args.v || args.version || !args.l) {
    echo("$ pps -l :7777");
    echo("$ pps -l 0.0.0.0:7777");
    echo("$ pps -l 1.2.3.4:7777");
    echo("");
    echo("v20220621");
    Deno.exit(0);
}

(async () => {
    var c = Deno.listenDatagram({ hostname: splithostport(args.l)[0], port: parseInt(splithostport(args.l)[1]), transport: "udp" });
    var b = new Uint8Array(100);
    for (;;) {
        var l = await c.receive(b);
        await c.send(s2b(joinhostport(l[1].hostname, l[1].port)), l[1]);
        if (joinhostport(l[1].hostname, l[1].port) == b2s(l[0])) {
            echo(`UDP: dst:${joinhostport(c.addr.hostname, c.addr.port)} <- src:${joinhostport(l[1].hostname, l[1].port)}`);
            echo(`UDP: src:${joinhostport(c.addr.hostname, c.addr.port)} -> dst:${joinhostport(l[1].hostname, l[1].port)}`);
        }
        if (joinhostport(l[1].hostname, l[1].port) != b2s(l[0])) {
            echo(`UDP: dst:${joinhostport(c.addr.hostname, c.addr.port)} <- src:${joinhostport(l[1].hostname, l[1].port)} <- dst:proxy <- src:${b2s(l[0])}`);
            echo(`UDP: src:${joinhostport(c.addr.hostname, c.addr.port)} -> dst:${joinhostport(l[1].hostname, l[1].port)} -> src:proxy -> ${b2s(l[0])}`);
        }
    }
})();

var c1 = Deno.listen({ hostname: splithostport(args.l)[0], port: parseInt(splithostport(args.l)[1]), transport: "tcp" });
for (;;) {
    try {
        const conn = await c1.accept();
        (async (conn) => {
            var b = new Uint8Array(100);
            for (;;) {
                try {
                    var i = await conn.read(b);
                    if (i === null) {
                        conn.close();
                        return;
                    }
                    var i = await conn.write(s2b(joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)));
                    if (joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port) == b2s(b.slice(0, i))) {
                        echo(`TCP: dst:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} <- src:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
                        echo(`TCP: src:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} -> dst:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)}`);
                    }
                    if (joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port) != b2s(b.slice(0, i))) {
                        echo(`TCP: dst:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} <- src:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} <- dst:proxy <- src:${b2s(b.slice(0, i))}`);
                        echo(`TCP: src:${joinhostport(conn.localAddr.hostname, conn.localAddr.port)} -> dst:${joinhostport(conn.remoteAddr.hostname, conn.remoteAddr.port)} -> src:proxy -> dst:${b2s(b.slice(0, i))}`);
                    }
                } catch (e) {
                    echo(`${e}`);
                    conn.close();
                    return;
                }
            }
        })(conn);
    } catch (e) {
        echo(`${e}`);
    }
}
