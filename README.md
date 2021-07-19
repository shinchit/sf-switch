# sf-switch
Salesforce のプロセスを一括オン・オフするスクリプト

# usage

## setting

`$ vi .env`

```
DOMAIN=<login or test。本番組織ならloginを指定する>
SF_USERNAME=<操作対象のSF組織のログインID>
SF_PASSWORD=<操作対象のSF組織のパスワード>
```

## execute

`$ npx tsc`

- プロセスビルダーを一括無効化
`$ node switch.js --mode off`
- プロセスビルダーを一括有効化
`$ node switch.js --mode on`
