@echo off
echo ======================================
echo    ポケモンバトルゲーム デプロイ
echo ======================================
echo.

echo [1/3] 変更をコミット中...
git add .
git commit -m "ゲーム更新: %date% %time%"

echo [2/3] GitHubにプッシュ中...
git push origin main

echo [3/3] 完了！
echo.
echo 🎉 デプロイが完了しました！
echo 数分後にサイトが更新されます：
echo https://ariariario5.github.io/pokemon1/
echo.
pause