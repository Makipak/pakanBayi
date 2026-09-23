// Custom server untuk hosting di cPanel (Passenger/Setup Node.js App).
// Passenger menjalankan file ini langsung dan expect app listen di process.env.PORT.

// Defense-in-depth: batasi threadpool SEBELUM require("next") supaya
// libuv/sharp init dengan concurrency kecil sejak awal. Env var yang sama
// juga di-set di cPanel Setup Node.js App > Environment Variables, tapi
// itu terbukti tidak selalu ke-propagate ke proses lsnode di hosting ini
// (insiden LVE Number of Processes mentok 22-23 Sep 2026) -- jadi di-hardcode
// di sini juga sebagai jaminan, bukan cuma gantung ke env var panel.
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2";
process.env.VIPS_CONCURRENCY = process.env.VIPS_CONCURRENCY || "1";

// FIX (23 Sep 2026): fetch() server-side ke API eksternal (mis. proxy wilayah
// ke emsifa.com) selalu gagal ETIMEDOUT di hosting ini, padahal curl ke IP yang
// sama sukses instan. Root cause: Node 18+ "Happy Eyeballs" (autoSelectFamily)
// coba connect ke beberapa alamat IP sekaligus secara paralel -- semua attempt
// paralel itu yang ETIMEDOUT, sedangkan koneksi tunggal (net.connect ke 1 IP)
// sukses <1 detik (confirmed via tes manual). Matikan mekanisme paralel itu,
// paksa resolve IPv4 dulu dan connect satu-satu kayak curl.
const net = require("net");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

// FIX UTAMA (23 Sep 2026): server ini "melihat" 30 CPU core (nproc/cpuinfo),
// padahal akun cPanel nggak dapat cgroup CPU quota apa pun. Library yang
// auto-scale ke jumlah core -- terutama Tokio runtime di dalam Prisma query
// engine -- jadi spawn puluhan thread (confirmed via ps -T: 30 tokio-rt-worker
// + 17 tokio-runtime-w = 47 dari 56 total thread) begitu ada query pertama
// (mis. login manggil prisma.user.findUnique). UV_THREADPOOL_SIZE/VIPS_CONCURRENCY
// di atas TIDAK menyentuh ini karena itu masalah libuv/sharp, bukan Tokio.
//
// Fix: paksa CPU affinity proses ini ke 2 core SEBELUM require("next")
// (yang nge-load Prisma Client). num_cpus (dipakai Tokio) baca
// sched_getaffinity di Linux, jadi begitu affinity dibatasi, Tokio cuma
// nganggep dia punya 2 core buat worker thread-nya.
try {
  require("child_process").execFileSync("taskset", ["-pc", "0,1", String(process.pid)]);
  console.log("[nutrimo] CPU affinity dibatasi ke core 0,1 (taskset)");
} catch (err) {
  console.error("[nutrimo] taskset gagal, lanjut tanpa CPU affinity limit:", err.message);
}

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server ready on port ${port}`);
  });
});
