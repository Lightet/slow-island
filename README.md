# 慢慢岛

十个可以停下来陪小动物玩一会儿的轻松小世界。纯静态 HTML、CSS 和 JavaScript，环境声在浏览器本地合成，不需要服务端、数据库或 API Key。

从 `index.html` 进入。也可以运行 `python3 -m http.server 8769`，打开 `http://localhost:8769/`。

- **摸摸手**：点一下动物，或按住轻轻来回摸。猫会闭眼歪头蹭手，身体和爪子留在原位；手移远后会停下。
- **各自的玩法**：鹈鹕吹泡泡、猫玩羽毛棒、兔子看蝴蝶、水豚拨水、海獭玩贝壳、小熊吹可可、企鹅寄信、熊猫嗅竹叶、刺猬闻花、狐狸追萤火虫。
- **小零食**：选择后点动物，零食会送到嘴边，配合咀嚼动作。
- **键盘**：Tab 选择，Enter / 空格互动；P 摸摸头，M 切换声音，空格暂停画面。
- **声音**：主动开启后播放。支持独立混音、暂停画面保留声音和渐弱定时。声音为本地合成，包含立体声环境底声、低频呼噜、纸张摩擦、水滴与轻铃。
- 尊重系统“减少动态效果”设置。手机可以点按或在动物上滑动。

`slow_island_collection.html` 是合集兼容入口；`pelican_bicycle_relax_fixed.html` 保留原骑行页的天气功能。

## 文件

- `01-…10-*.html`：场景、角色位置及固定遮挡。
- `assets/companions.js` / `.css`：头部、表情、猫尾巴与手的互动。
- `assets/animal-atlas.png`：透明动物图集；`contented-faces.webp` 仅采样脸部，`petting-hand.webp` 为透明手部素材。
- `assets/world.js`：场景动画、拖拽、粒子、音效与播放控制。
- `assets/gallery.js` / `.css`：合集浏览和场景切换。

所有资源和导航使用相对地址，支持 GitHub Pages 项目子路径。保留同目录场景页和整个 `assets/` 文件夹即可部署。

开发时运行 `python3 scripts/build-gallery.py` 同步合集预览；运行 `python3 scripts/package-site.py` 生成部署 ZIP。角色、手部和闭眼表情由内置 imagegen 生成；提示词记录位于 `assets/animal-art-prompt.md` 与 `assets/interaction-art-prompt.md`。
