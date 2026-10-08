using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

// Mở máy chủ bằng môi trường đi kèm và lưu dữ liệu riêng của người sử dụng.
class HomeFix : Form {
    readonly string app = AppDomain.CurrentDomain.BaseDirectory;
    readonly string data = Environment.GetEnvironmentVariable("HOMEFIX_DATA_DIR") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HomeFix");
    readonly TextBox log = new TextBox { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, Dock = DockStyle.Fill };
    readonly Label status = new Label { Text = "HomeFix • Sửa chữa và bảo trì", Dock = DockStyle.Top, Height = 45, Padding = new Padding(12), Font = new System.Drawing.Font("Segoe UI", 12) };
    Process server;
    bool starting;
    string url = "http://localhost:3000";
    HomeFix() {
        Text = "HomeFix"; Width = 760; Height = 490;
        Font = new System.Drawing.Font("Segoe UI", 10);
        StartPosition = FormStartPosition.CenterScreen;
        var actions = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 55, Padding = new Padding(8) };
        AddButton(actions, "Mở HomeFix", async () => await Start());
        AddButton(actions, "Hướng dẫn", () => { Open(Path.Combine(app, "HomeFix-User-Manual.chm")); return Task.FromResult(0); });
        AddButton(actions, "Cấu hình", () => { Directory.CreateDirectory(data); Open(Path.Combine(data, "homefix.env"), "notepad.exe"); return Task.FromResult(0); });
        AddButton(actions, "Dừng máy chủ", () => { Stop(); return Task.FromResult(0); });
        Controls.Add(log); Controls.Add(actions); Controls.Add(status);
        Shown += async (sender, e) => await Start();
        FormClosing += (sender, e) => Stop();
    }
    void AddButton(FlowLayoutPanel panel, string title, Func<Task> action) {
        var button = new Button { Text = title, AutoSize = true, Height = 34 };
        button.Click += async (sender, e) => { try { await action(); } catch (Exception ex) { MessageBox.Show(ex.Message, "HomeFix", MessageBoxButtons.OK, MessageBoxIcon.Error); } };
        panel.Controls.Add(button);
    }
    void Write(string text) {
        if (IsDisposed || !IsHandleCreated || text == null) return;
        BeginInvoke((Action)(() => log.AppendText(text + Environment.NewLine)));
    }
    void Open(string target, string program = null) {
        if (program == null) Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
        else Process.Start(new ProcessStartInfo(program, "\"" + target + "\"") { UseShellExecute = true });
    }
    Process Node(string arguments) {
        var info = new ProcessStartInfo(Path.Combine(app, "runtime", "node.exe"), arguments) {
            WorkingDirectory = Path.Combine(app, "SRC"), UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
        };
        info.EnvironmentVariables["HOMEFIX_ENV_FILE"] = Path.Combine(data, "homefix.env");
        info.EnvironmentVariables["HOMEFIX_UPLOADS_DIR"] = Path.Combine(data, "uploads");
        info.EnvironmentVariables["HOST"] = "0.0.0.0";
        var process = new Process { StartInfo = info, EnableRaisingEvents = true };
        process.OutputDataReceived += (sender, e) => Write(e.Data);
        process.ErrorDataReceived += (sender, e) => Write(e.Data);
        process.Start(); process.BeginOutputReadLine(); process.BeginErrorReadLine();
        return process;
    }
    async Task Run(string arguments) {
        using (var process = Node(arguments)) {
            await Task.Run(() => process.WaitForExit());
            if (process.ExitCode != 0) throw new Exception("Không khởi tạo được HomeFix. Xem thông báo và mục Xử lý lỗi trong hướng dẫn.");
        }
    }
    async Task<bool> Healthy() {
        return await Task.Run(() => {
            try {
                var request = (HttpWebRequest)WebRequest.Create(url + "/api/health");
                request.Timeout = 1500;
                using (var response = request.GetResponse()) using (var reader = new StreamReader(response.GetResponseStream())) {
                    var body = reader.ReadToEnd(); return body.Contains("\"status\":\"ok\"") && body.Contains("\"data\"");
                }
            } catch { return false; }
        });
    }
    async Task Start() {
        if (starting) return;
        starting = true;
        try {
            Directory.CreateDirectory(data);
            status.Text = "Đang chuẩn bị HomeFix…";
            await Run("scripts/configure-env.js \"DB_SERVER=(localdb)\\HomeFix\" DB_NAME=HomeFix_Desktop");
            foreach (var line in File.ReadAllLines(Path.Combine(data, "homefix.env"))) {
                if (line.StartsWith("PORT=")) url = "http://localhost:" + line.Substring(5).Trim();
            }
            if (!await Healthy()) {
                if (server != null && !server.HasExited) throw new Exception("Máy chủ đang chạy nhưng chưa phản hồi. Hãy chờ hoặc bấm Dừng máy chủ rồi mở lại.");
                var settings = File.ReadAllText(Path.Combine(data, "homefix.env"));
                if (settings.Contains("DB_SERVER=(localdb)\\HomeFix")) {
                    string localdb = null;
                    foreach (var version in new [] { "170", "160", "150" }) {
                        var candidate = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft SQL Server", version, "Tools", "Binn", "SqlLocalDB.exe");
                        if (File.Exists(candidate)) { localdb = candidate; break; }
                    }
                    if (localdb == null) throw new Exception("Chưa có SQL Server LocalDB. Chạy lại HomeFix-Setup.exe để cài thành phần này.");
                    await Task.Run(() => {
                        foreach (var args in new [] { "create HomeFix", "start HomeFix" }) {
                            using (var process = Process.Start(new ProcessStartInfo(localdb, args) { CreateNoWindow = true, UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true })) {
                                var stdout = process.StandardOutput.ReadToEnd(); var stderr = process.StandardError.ReadToEnd(); process.WaitForExit();
                                if (args.StartsWith("start") && process.ExitCode != 0) throw new Exception(stderr + stdout);
                            }
                        }
                    });
                }
                await Run("scripts/init-db.js");
                server = Node("backend/src/server.js");
                bool ready = false;
                for (int i = 0; i < 40; i++) {
                    if (server.HasExited) throw new Exception("Máy chủ đã dừng. Kiểm tra nhật ký bên dưới.");
                    if (await Healthy()) { ready = true; break; }
                    await Task.Delay(500);
                }
                if (!ready) throw new Exception("Máy chủ chưa sẵn sàng. Kiểm tra SQL Server và cổng trong Cấu hình.");
            }
            status.Text = "HomeFix đang chạy • " + url;
            Write("Giữ cửa sổ này mở khi sử dụng website hoặc Android. Đóng cửa sổ để dừng máy chủ do cửa sổ này mở.");
            if (Environment.GetEnvironmentVariable("HOMEFIX_NO_BROWSER") != "1") Open(url);
        } catch (Exception ex) { status.Text = "Chưa khởi động được HomeFix"; Write(ex.Message); }
        finally { starting = false; }
    }
    void Stop() {
        if (server != null) {
            try { if (!server.HasExited) { server.Kill(); server.WaitForExit(5000); } } catch { }
            server.Dispose(); server = null;
        }
        status.Text = "Máy chủ của cửa sổ này đã dừng";
    }
    [STAThread] static void Main() { Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new HomeFix()); }
}
