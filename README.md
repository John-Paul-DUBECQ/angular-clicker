# Application Angular

Application Angular.

## Prérequis

- Node.js et npm (ou [nvm](https://github.com/nvm-sh/nvm) pour gérer les versions)
- Angular CLI : `npm install -g @angular/cli`

## Lancer l'application

```shell
npm install
npm start
```

Ou avec la commande Angular : `ng serve`. L'app sera disponible sur http://localhost:4200.

## Build de production

```shell
npm run build
```

Les fichiers sont générés dans `dist/client`.

## À propos du backend

L'application appelait auparavant une API Java sur `http://localhost:8080/game`.  
Sans backend, les appels dans `GameService` échoueront. Vous pouvez :
- brancher un autre backend (Node, autre API) en modifiant l'URL dans `src/app/models/game/game.service.ts` ;
- ou implémenter un mode mock / données locales dans le service.

## Licence

Code sous [MIT License](LICENSE).
