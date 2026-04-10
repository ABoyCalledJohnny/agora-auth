# Changelog

## [0.4.0-rc.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.3.0...v0.4.0-rc.0) (2026-04-10)

### Features

- **auth:** normalize usernames to lowercase at validation layer ([e54e1da](https://github.com/ABoyCalledJohnny/agora-auth/commit/e54e1dae83145caf6ae2c8cbb6222ea8763c8eca))
- frontend shell, auth UI, and proxy-based session refresh ([#4](https://github.com/ABoyCalledJohnny/agora-auth/issues/4)) ([57ff768](https://github.com/ABoyCalledJohnny/agora-auth/commit/57ff768a0d5918b7643878860a605a3182da1b03))

### Bug Fixes

- add css file extension to lint-staged pre-commit hook ([55cfa14](https://github.com/ABoyCalledJohnny/agora-auth/commit/55cfa143e4a146b91c042e5799b50a5b5956295f))
- add dedicated jwt verification in proxy ([ec7f47d](https://github.com/ABoyCalledJohnny/agora-auth/commit/ec7f47d7c4c82b42c35219eaa703e4be5ef91717))
- **deps:** override picomatch to ^4.0.4 to resolve audit vulnerabilities ([5fb83fe](https://github.com/ABoyCalledJohnny/agora-auth/commit/5fb83fe1132aa67a9d4b115670d7066aa4691f7a))
- remove server-only from db/index.ts and crypto.ts ([481dfd7](https://github.com/ABoyCalledJohnny/agora-auth/commit/481dfd78d5e4a62b11c667c4bf33c09f3e29eb68))
- remove server-only from repos ([b2950c1](https://github.com/ABoyCalledJohnny/agora-auth/commit/b2950c11adc35745c7a8b4852491a151c18c3f2d))
- use viewport-relative padding for centered layout to prevent mobile scroll ([1f0d79e](https://github.com/ABoyCalledJohnny/agora-auth/commit/1f0d79e57eb1057af013aa7cfdef64ab32400f8f))

### Documentation

- add presentation notes, API route overview, and security details ([fcc0ae5](https://github.com/ABoyCalledJohnny/agora-auth/commit/fcc0ae5bd403d42e2001153386d56b5f25db788f))
- **todo:** update tasks ([941ddfc](https://github.com/ABoyCalledJohnny/agora-auth/commit/941ddfccf33c232df4a61d13a485497afca43996))

### CI

- implement CI/CD pipeline with GitHub Actions, GHCR, and Docker Compose deploymentChore/cicd deploy pipeline ([#3](https://github.com/ABoyCalledJohnny/agora-auth/issues/3)) ([1080875](https://github.com/ABoyCalledJohnny/agora-auth/commit/108087573ecf6bdd0a976188e0c9ccd6a3d64031))

## [0.3.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.3.0-rc.0...v0.3.0) (2026-03-25)

### Documentation

- **notes:** update schedule ([32191ae](https://github.com/ABoyCalledJohnny/agora-auth/commit/32191ae21350a59318c6fe9e948353a8631df9f9))
- update MVP frontend scoping in documentation and badge ([d1f2453](https://github.com/ABoyCalledJohnny/agora-auth/commit/d1f245365353e14c180a84262374676945a3c8e6))

## [0.3.0-rc.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.2.0...v0.3.0-rc.0) (2026-03-24)

### Features

- **auth:** implement complete backend authentication flow and API wrappers ([#2](https://github.com/ABoyCalledJohnny/agora-auth/issues/2)) ([3f1eceb](https://github.com/ABoyCalledJohnny/agora-auth/commit/3f1eceb088c9085875abdb6e1415f681fa5097dc))

### Chores

- **deps:** update project dependencies and bun ([031b93f](https://github.com/ABoyCalledJohnny/agora-auth/commit/031b93f2ca61504bcc69ee795bf08e0255af6376))
- improve db seed script and fix drizzle-seed runtime bug ([c992035](https://github.com/ABoyCalledJohnny/agora-auth/commit/c9920350d1be5da26cbf81d3810f6e0cfc9dae11))

## [0.2.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.2.0-rc.0...v0.2.0) (2026-03-20)

### Chores

- include repository JSDoc improvements ([ad7796e](https://github.com/ABoyCalledJohnny/agora-auth/commit/ad7796e2a16a212e7fcd39fd8b0fc494fad2f7a2))

## [0.2.0-rc.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.1.0...v0.2.0-rc.0) (2026-03-19)

### Features

- **core:** establish database layer, repositories, and API wrappers ([#1](https://github.com/ABoyCalledJohnny/agora-auth/issues/1)) ([5303ca3](https://github.com/ABoyCalledJohnny/agora-auth/commit/5303ca3e4afaff2ab4631e32c651d2a30fd2c066))

### Documentation

- **todo:** update project todo ([7bd380d](https://github.com/ABoyCalledJohnny/agora-auth/commit/7bd380def8488fffc1145091c5c215636226604f))

### Chores

- **scripts:** add release it with rc tag command ([0ddbda3](https://github.com/ABoyCalledJohnny/agora-auth/commit/0ddbda31865b9c10155b71314abc048f0002c262))

## [0.1.0](https://github.com/ABoyCalledJohnny/agora-auth/compare/v0.1.0-rc.0...v0.1.0) (2026-03-19)

### Features

- **validation:** add publicId schema and document ID format rationale ([281495e](https://github.com/ABoyCalledJohnny/agora-auth/commit/281495eef74d1ac0fbd0516c381e30891f96fc49))

### Documentation

- **todo:** mark release and cooperation tasks as completed ([4d3c4d5](https://github.com/ABoyCalledJohnny/agora-auth/commit/4d3c4d5e91516b61637222a2c13349735881b2a8))

### Chores

- configure husky and lint-staged ([797b4cf](https://github.com/ABoyCalledJohnny/agora-auth/commit/797b4cfed819bdcec2b6299f38c45fda852b756c))
- **husky:** add shebang to pre-commit script ([0f8cdb1](https://github.com/ABoyCalledJohnny/agora-auth/commit/0f8cdb10ef40cc4d07a206fee1980cf36fc5ed34))
- **husky:** make pre-commit executable ([42d1f59](https://github.com/ABoyCalledJohnny/agora-auth/commit/42d1f59c7daf7d762b59c7e1efd9c60306c87f21))
- **lint-staged:** update configuration ([1f2c1de](https://github.com/ABoyCalledJohnny/agora-auth/commit/1f2c1de8000f2719f066515261c10ac822dbef00))
- **release:** fix conventional-changelog plugin config ([e925ba1](https://github.com/ABoyCalledJohnny/agora-auth/commit/e925ba1fe2fa9e6a65aa51ebb9afe8e78307d7ab))
- **release:** normalise validation.ts ([0862271](https://github.com/ABoyCalledJohnny/agora-auth/commit/086227151f2c8b9ce3172be232014506fe44d319))

## 0.1.0-rc.0 (2026-03-15)

## 0.0.0 (2026-03-15)
