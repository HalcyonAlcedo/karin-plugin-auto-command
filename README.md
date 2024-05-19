# 自动命令插件

---

基于讯飞星火对自然消息进行处理自动生成命令消息
可以通过向机器人发送`#？ 我想查看系统状态`触发`#状态`命令

## 安装

karin根目录执行以下命令克隆仓库到本地

```bash
git clone https://github.com/HalcyonAlcedo/karin-plugin-auto-command.git ./plugins/karin-plugin-auto-command
```

## 配置

> 推荐使用 [Karin Manage](https://github.com/HalcyonAlcedo/karin-plugin-manage) 进行配置

根据[星火API接入](https://xinghuo.xfyun.cn/sparkapi)将`AppId`、`APISecret`、`APIKey`填入配置文件

领取免费试用的模型套餐

根据领取的模型套餐类型设置`Domain`模型，默认为V3.0

## 开发调试

```bash
node . --dev
```
