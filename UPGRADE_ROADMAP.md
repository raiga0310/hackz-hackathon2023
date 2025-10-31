# Vercelデプロイ対応 ライブラリアップグレードロードマップ

## 概要
現在のプロジェクト（hackz-app）を最新のVercelにデプロイできるようにするためのライブラリアップグレード計画です。

## 現在のバージョン状況

### フレームワーク・ランタイム
| ライブラリ | 現在 | 最新安定版 | 推奨バージョン | 優先度 |
|-----------|------|-----------|-------------|--------|
| Next.js | 13.4.19 | 14.2.x | 14.2.x | 🔴 高 |
| React | 18.2.0 | 18.3.1 | 18.3.1 | 🟡 中 |
| React DOM | 18.2.0 | 18.3.1 | 18.3.1 | 🟡 中 |
| TypeScript | 5.2.2 | 5.6.x | 5.5.x | 🟡 中 |
| Node.js | 未指定 | 20.x LTS | 20.x LTS | 🔴 高 |

### 開発ツール・設定
| ライブラリ | 現在 | 最新安定版 | 推奨バージョン | 優先度 |
|-----------|------|-----------|-------------|--------|
| ESLint | 8.49.0 | 9.x | 8.57.x | 🟡 中 |
| eslint-config-next | 13.4.19 | 14.2.x | 14.2.x | 🔴 高 |
| Tailwind CSS | 3.3.3 | 3.4.x | 3.4.x | 🟢 低 |
| PostCSS | 8.4.29 | 8.4.x | 8.4.x | 🟢 低 |
| Autoprefixer | 10.4.15 | 10.4.x | 10.4.x | 🟢 低 |

### 3D/ゲーム関連
| ライブラリ | 現在 | 最新安定版 | 推奨バージョン | 優先度 |
|-----------|------|-----------|-------------|--------|
| @babylonjs/core | 6.21.0 | 7.x | 7.x | 🟡 中 |
| babylonjs | 6.21.1 | 7.x | 7.x | 🟡 中 |
| babylonjs-gui | 6.21.1 | 7.x | 7.x | 🟡 中 |
| babylonjs-materials | 6.21.1 | 7.x | 7.x | 🟡 中 |

### 型定義
| ライブラリ | 現在 | 最新安定版 | 推奨バージョン | 優先度 |
|-----------|------|-----------|-------------|--------|
| @types/node | 20.6.1 | 20.x | 20.x | 🟢 低 |
| @types/react | 18.2.21 | 18.3.x | 18.3.x | 🟡 中 |
| @types/react-dom | 18.2.7 | 18.3.x | 18.3.x | 🟡 中 |

## アップグレード戦略

### フェーズ1: 緊急対応（Vercelデプロイ最低要件）
**目標**: Vercelでのデプロイを可能にする

#### 1.1 Node.js環境の設定
```bash
# .nvmrcファイルを作成してNode.jsバージョンを固定
echo "20" > .nvmrc
```

#### 1.2 Next.js 14へのアップグレード
```bash
npm install next@latest react@latest react-dom@latest
npm install --save-dev eslint-config-next@latest
```

**重要な変更点**:
- App Router（既に使用中）の最新機能に対応
- TypeScript設定の調整が必要な可能性
- `next.config.js`の設定見直し

#### 1.3 TypeScript設定の更新
`tsconfig.json`の更新:
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "moduleResolution": "node"
  }
}
```

### フェーズ2: 安定性向上（中優先度）
**目標**: 開発体験とパフォーマンスの向上

#### 2.1 React 18.3.xへのアップグレード
```bash
npm install react@^18.3.1 react-dom@^18.3.1
npm install --save-dev @types/react@^18.3.0 @types/react-dom@^18.3.0
```

#### 2.2 TypeScript 5.5.xへのアップグレード
```bash
npm install --save-dev typescript@^5.5.0
```

#### 2.3 Babylon.js 7.xへのアップグレード
```bash
npm install @babylonjs/core@latest babylonjs@latest babylonjs-gui@latest babylonjs-materials@latest
```

**注意点**:
- Breaking changesの可能性があるため、十分なテストが必要
- 3Dレンダリング部分の動作確認必須

### フェーズ3: 最適化（低優先度）
**目標**: 最新のベストプラクティスに準拠

#### 3.1 Tailwind CSS 3.4.xへのアップグレード
```bash
npm install --save-dev tailwindcss@latest postcss@latest autoprefixer@latest
```

#### 3.2 ESLint設定の最新化
```bash
npm install --save-dev eslint@^8.57.0
```

## 実行手順

### ステップ1: バックアップとブランチ作成
```bash
git checkout -b upgrade/vercel-deploy-compatibility
git add .
git commit -m "Pre-upgrade backup"
```

### ステップ2: 依存関係の更新
```bash
# フェーズ1の実行
echo "20" > .nvmrc
npm install next@latest react@latest react-dom@latest
npm install --save-dev eslint-config-next@latest

# package.jsonの確認
npm audit
npm test  # もしテストがある場合
```

### ステップ3: 設定ファイルの更新
```bash
# TypeScript設定の更新
# tsconfig.jsonのtargetをes2017に変更
# moduleResolutionをnodeに変更
```

### ステップ4: 動作確認
```bash
npm run build
npm run start
```

### ステップ5: Vercelデプロイテスト
```bash
# Vercel CLIでデプロイテスト
npx vercel --prod
```

## 潜在的な問題と対策

### 1. Next.js 14での破壊的変更
- **問題**: App Routerの新しい動作
- **対策**: 公式マイグレーションガイドに従って段階的に更新

### 2. Babylon.js 7.xでの破壊的変更
- **問題**: API変更による3Dレンダリングの不具合
- **対策**: 
  - 詳細なテストケース作成
  - 段階的アップグレード（まずminor版から）

### 3. TypeScript 5.5での型チェック厳格化
- **問題**: 新しい型エラーの発生
- **対策**: 
  - `skipLibCheck: true`の一時的使用
  - 段階的な型修正

### 4. ESLintルールの変更
- **問題**: 新しいlintエラー
- **対策**: 
  - `.eslintrc`の段階的更新
  - 必要に応じてルール無効化

## 成功指標

### 必須要件
- [ ] `npm run build`の成功
- [ ] `npm run start`でのローカル動作確認
- [ ] Vercelでのデプロイ成功
- [ ] 3Dゲーム機能の正常動作

### 理想要件
- [ ] ビルド時間の短縮
- [ ] バンドルサイズの最適化
- [ ] TypeScriptエラーゼロ
- [ ] ESLintエラーゼロ

## 参考リンク

- [Next.js 14 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-14)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Babylon.js 7.0 Migration Guide](https://doc.babylonjs.com/)
- [React 18.3 Release Notes](https://react.dev/blog)

## 注意事項

1. **段階的アップグレード**: 一度にすべてを更新せず、フェーズごとに進める
2. **テスト重視**: 特に3D機能は入念にテスト
3. **バックアップ**: 各フェーズ前に必ずコミット
4. **ドキュメント確認**: 各ライブラリの破壊的変更を事前確認

---

*このロードマップは2025年10月31日時点の情報に基づいています。実行前に最新の公式ドキュメントを確認してください。*