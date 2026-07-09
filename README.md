# 离线像素游戏厅

这是一个纯静态浏览器游戏。整包只依赖本地文件，不需要安装依赖，也不需要联网。

## 用 Chrome 离线打开

推荐方式：

1. 保持 `index.html`、`arcade.js` 和 `open-offline.bat` 在同一个文件夹。
2. 双击 `open-offline.bat`。
3. 脚本会用 Chrome 打开本地 `file:///.../index.html`。

手动方式：

1. 打开 Chrome。
2. 按 `Ctrl+O`，选择这个文件夹里的 `index.html`。
3. 或者直接把 `index.html` 拖进 Chrome 窗口。

## 离线部署包

把整个文件夹复制到 U 盘、移动硬盘或没有网络的电脑上即可使用。不要只复制 `index.html`，因为游戏逻辑在同目录的 `arcade.js` 里。

最小离线包需要这些文件：

- `index.html`
- `arcade.js`
- `open-offline.bat`

## 浏览器部署

如果要放到网页服务器上，也只需要把 `index.html` 和 `arcade.js` 放在同一个目录，由任意静态文件服务托管即可。当前页面没有 CDN、图片、字体或 API 请求，所以在线访问一次和 offline 本地打开使用的是同一套文件。

## 测试

在有 Node.js 的开发环境里运行：

```bash
node tests/arcade.test.js
```
