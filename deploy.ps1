cd frontend
npm run build -- --base=./
cd ..
Remove-Item -Recurse -Force docs/*
Copy-Item frontend/dist/index.html docs/
Copy-Item frontend/dist/favicon.svg docs/
Copy-Item frontend/dist/icons.svg docs/
Copy-Item -Recurse frontend/dist/assets docs/assets
git add -A
git commit -m "deploy: rebuild for GitHub Pages"
git push origin main
Write-Host "Done! Site will update in ~1 minute."
