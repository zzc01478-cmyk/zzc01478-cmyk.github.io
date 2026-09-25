export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>© 2026 抽纸盒</span>
        <nav className="footer-links" aria-label="页脚导航">
          <a href="/contact/">联系</a>
          <a href="/privacy/">隐私</a>
          <a href="/terms/">条款</a>
          <a href="https://chenzhihong.online/tools/">工具箱</a>
        </nav>
        <span className="footer-credit">部分交互参考 <a href="https://skiper-ui.com" rel="noopener">Skiper UI</a></span>
      </div>
    </footer>
  );
}
