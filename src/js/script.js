document.addEventListener('DOMContentLoaded', () => {
    // 映射导航链接文本到Markdown文件路径
    const markdownFileMap = {
        "编程基础PPC": "./guidebook/ppc/ppc.md",
        "密码学CRYPTO": "./guidebook/crypto/crypto.md",
        "网络安全WEB": "./guidebook/web/web.md",
        "二进制BINARY": "./guidebook/binary/binary.md",
        "安全杂项MISC": "./guidebook/misc/misc.md"
    };

    const contentContainer = document.getElementById('content-container');
    // const pageTitle = document.querySelector('.header h2');
    const navLinks = document.querySelectorAll('.sidebar .nav-links a');
    const tocContainer = document.getElementById('toc-container');
    const tocList = document.getElementById('toc-list');
    
    let headingOffsets = [];

    // --- TOC 和滚动高亮逻辑 ---
    
    // 1. 生成TOC
    const generateToc = () => {
        tocList.innerHTML = '';
        headingOffsets = [];
        const headings = contentContainer.querySelectorAll('h2, h3');
        if (headings.length < 2) {
            tocContainer.style.display = 'none';
            return;
        }

        headings.forEach((heading, index) => {
            const text = heading.textContent;
            const id = `heading-${index}`;
            heading.id = id;

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = text;
            a.href = `#${id}`;
            a.className = `toc-${heading.tagName.toLowerCase()}`;
            li.appendChild(a);
            tocList.appendChild(li);
            
            headingOffsets.push({ id: id, offset: heading.offsetTop });
        });
        tocContainer.style.display = 'block';
    };

    // 2. 滚动监听以高亮TOC
    const onScroll = () => {
        if (!headingOffsets.length) return;

        const scrollPosition = window.scrollY + 150; // 偏移量，使高亮更准确
        let currentActiveId = null;

        for (let i = headingOffsets.length - 1; i >= 0; i--) {
            if (scrollPosition >= headingOffsets[i].offset) {
                currentActiveId = headingOffsets[i].id;
                break;
            }
        }
        
        tocList.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href === `#${currentActiveId}`) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });


    // --- Markdown渲染逻辑 ---
    
    // 渲染Markdown内容
    const renderMarkdown = (filePath) => {
        tocContainer.style.display = 'none'; // 渲染前隐藏TOC
        contentContainer.innerHTML = '<p>正在加载...</p>';

        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error(`文件加载失败: ${response.statusText}`);
                return response.text();
            })
            .then(text => {
                // 使用 marked.js 解析
                // 设置引用链接的解析，在前添加 "/Coding" 前缀
                text = text.replace(/!\[([^\]]*)\]\((?!http)([^)]+)\)/g, (match, alt, src) => {
                    if (src.startsWith('/')) {
                        src = src.replace('/', '/Coding/');
                    }
                    return `![${alt}](${src})`;
                });
                contentContainer.innerHTML = marked.parse(text);

                // // 渲染数学公式
                // renderMathInElement(contentContainer, {
                //     delimiters: [
                //         {left: "$$", right: "$$", display: true},
                //         {left: "$", right: "$", display: false},
                //     ],
                // });

                // 高亮代码块
                contentContainer.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
                
                // 生成TOC
                generateToc();
                // 手动触发一次滚动，以正确高亮初始位置的TOC
                setTimeout(onScroll, 100);
            })
            .catch(error => {
                console.error('渲染Markdown时出错:', error);
                contentContainer.innerHTML = `<p style="color:red;">内容加载失败。详情请查看控制台。</p>`;
            });
    };

    // --- 事件监听和初始化 ---

    // 为导航链接添加点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('coming-soon')) return;

            navLinks.forEach(a => a.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.trim();
            // pageTitle.textContent = linkText;

            const filePath = markdownFileMap[linkText];
            if (filePath) {
                renderMarkdown(filePath);
            } else {
                contentContainer.innerHTML = `<p>未找到该主题的内容。</p>`;
                tocContainer.style.display = 'none';
            }
        });
    });

    // 配置 marked.js
    marked.setOptions({
        gfm: true,
        breaks: true,
        smartLists: true,
    });
    
    // 初始化时加载第一个有效链接的内容
    const firstLink = document.querySelector('.sidebar .nav-links a:not(.coming-soon)');
    if (firstLink) {
        firstLink.click();
    }
});