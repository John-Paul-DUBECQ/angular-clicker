# Récapitulatif des personnages et déblocages

Ce document résume les paliers présents dans le code. Les niveaux sont ceux du personnage concerné. Les achats du shop restent soumis à leur prix et, parfois, à l'achat préalable d'un autre item.

## Personnages

| Personnage | Condition d'apparition | Déblocages et paliers |
|---|---|---|
| **Épée** | Personnage de départ | Aucun déblocage fonctionnel par niveau. Ses items de shop sont détaillés plus bas. |
| **Fermier** | Épée niveau 1 | Niveau 100 : débloque la zone des maisons. La zone peut aussi apparaître plus tôt avec les vaisseaux du Géomètre niveau 1. |
| **Mineur** | Fermier niveau 3 | Niveau 1 : coups critiques (base : 1 % de chance, dégâts ×2). Niveaux 10, 25, 40 : +2 points de chance critique chacun. Niveaux 15, 35, 50 : dégâts critiques ×1,5 chacun. |
| **Forgeron** | Mineur niveau 5 | Niveau 10 : barre de streak (800 clics pour l'activer, dégâts ×2). Niveau 20 : 100 clics de moins pour remplir la barre. Niveau 25 : dégâts du streak ×2. Niveau 35 : la barre descend 5 points/s moins vite. Niveau 45 : encore 100 clics de moins. Niveau 50 : dégâts du streak ×2. Niveau 60 : la barre descend encore 10 points/s moins vite. Niveau 100 : 200 clics de moins. |
| **Astrologue** | Forgeron niveau 8 | Niveau 1 : soleil orbital, clic ×2. Niveau 5 : rotation ralentie de 20 %. Niveau 10 : dégâts du soleil ×2. Niveau 15 : taille ×1,2. Niveau 20 : rotation ralentie de 30 %. Niveau 25 : dégâts du soleil ×2. Niveau 30 : taille ×1,4. Niveau 35 : dégâts du soleil ×2. Niveau 50 : rotation ralentie de 40 %. Niveau 60 : taille ×1,4. **Niveau 75 : Maison d'équilibrage solaire**, indiquée dans ses prochains paliers. |
| **Magicien** | Astrologue niveau 10 | Niveau 1 : pouvoirs et barre de mana. Réserves de mana : +50 aux niveaux 5, +100 au niveau 30, +200 au niveau 100. Régénération : +0,02/s au niveau 15, +0,05/s au niveau 50, +0,1/s au niveau 150. Sorts : voir la section suivante. |
| **Alchimiste** | Magicien niveau 10 | Niveau 1 : apparition des monstres. Mosh et Calque sont disponibles au niveau 1 de l'Alchimiste; Super-Mosh et Sac Poubelle Sama au niveau 5; Gribouy, Molusk, Peji et Pwaskay au niveau 10. Niveau 1 : premier combat prévu. Niveau 5 : second combat prévu, après une victoire contre le premier. |
| **Géomètre** | Alchimiste niveau 12 | Niveau 1 : vaisseaux et récompenses à cliquer. Niveau 3 : fréquence améliorée; niveau 4 : récompenses ×1,4; niveau 6 : fréquence encore améliorée; niveau 8 : récompenses ×1,5. Niveau 20 : Hangar de ravitaillement. Niveau 25 : Observatoire des Vaisseaux et accès au sort Rafale stellaire (avec Magicien niveau 1). |
| **Architecte** | Géomètre niveau 10 | Pas de fonctionnalité propre supplémentaire déclarée dans sa liste de déblocages. **À noter :** le code actuel branche l'accès au shop d'essences sur l'index du Géomètre niveau 1, malgré le commentaire qui attribue cette boutique à l'Architecte. |
| **Explorateur** | Architecte niveau 10 | Pas encore de fonctionnalité débloquée dans le code; la transition vers l'acte II est encore vide. |

## Sorts (Magicien)

Les sorts peuvent également demander un niveau d'un autre personnage.

| Sort | Déblocage | Effet et coût actuels |
|---|---|---|
| Force (`힘`) | Magicien 1 | Dégâts ×2 pendant 1 minute; 200 mana; recharge 120 s. |
| Invocation | Magicien 1 **et** Alchimiste 1 | Fait apparaître le prochain monstre; 1 appât et 10 mana dans les données du jeu. |
| +30 s combat | Magicien 5 **et** Alchimiste 1 | Ajoute 30 s au combat; 200 mana; recharge 90 s. |
| Faiblesse (`약점`) | Magicien 9 | Réduit le seuil et la vitesse de baisse du streak; 400 mana; recharge 300 s. |
| Rafale stellaire | Magicien 1 **et** Géomètre 25 | Lance une rafale de vaisseaux; 3 appâts et 100 mana. La Maison d'équilibrage solaire ne change pas cette condition. |

## Maisons

Les maisons se débloquent par achat avec essence et ressources. Les niveaux déjà achetés sont conservés dans la sauvegarde.

| Maison | Disponibilité | Effet |
|---|---|---|
| Maison du Mineur | Zone des maisons disponible | +3 % de chance de critique par niveau. |
| Maison des Appâts | Zone des maisons disponible | Génère des appâts automatiquement; l'intervalle diminue de 20 s par niveau. |
| Hangar de ravitaillement | Géomètre 20 | Par niveau : récompenses de vaisseaux ×1,1 et intervalle de vaisseaux ×0,9. Niveau 2 : récompenses ×1,21 et intervalle réduit de 19 %. Maximum : 10. |
| Observatoire des Vaisseaux | Géomètre 25 | Par niveau : +2 vaisseaux et +1 s à Rafale stellaire. Maximum : 10. |
| **Maison d'équilibrage solaire** | Astrologue 75 | À l'achat, étend la zone de clic à toute la colonne centrale et débloque les Maisons du Soleil bleu et jaune. Par niveau : ajoute 0,3 % des dégâts AFK à chaque clic et 5 % des dégâts de clic à la production AFK. Les deux transferts s'appliquent simultanément. Maximum : 10. |
| **Maison du Soleil bleu** | Révélée après l'achat de la Maison d'équilibrage solaire | Pendant la phase bleue, par niveau : dégâts AFK ×1,05, récompense de clic ×1,05, +0,1 mana par clic, +0,5 point de chance critique et dégâts critiques ×1,05. Maximum : 10. |
| **Maison du Soleil jaune** | Révélée après l'achat de la Maison d'équilibrage solaire | Pendant la phase jaune, par niveau : délai d'apparition des monstres ×0,95 et progression du streak +10 % par clic. Au niveau 10, la progression du streak est ×2. Maximum : 10. |

Les maisons du Soleil portent le tag **Soleil**. Les deux soleils orbitent en symétrie centrale; une phase jaune puis une phase bleue alternent toutes les minutes. Seule la couleur active applique ses bonus. La zone de clic agrandie exclut les contrôles interactifs.

## Autres déblocages de shop dépendant d'un niveau

- **Épée** : l'Épée en bois trempé demande l'item d'entraînement et Épée 25; l'Épée en calcaire demande l'item précédent et Épée 50. La Frangipane demande l'item d'entraînement et Fermier 10.
- **Magicien** : Amulette de mana au niveau 1, Cristal de mana au niveau 5, Fontaine de mana au niveau 10.
- **Mineur** : Pierre de chance au niveau 1; Pierre de chance 2 après achat de la première et Mineur 30.

## Affichage et sauvegarde

- Les options « Afficher les dégâts à chaque clic » et « Afficher les coups critiques » sont sauvegardées dans la sauvegarde locale.
- La barre de mana reste liée au déblocage des pouvoirs (Magicien 1).
- La jauge de prochain monstre reste affichée quand la barre de streak est débloquée (Forgeron 10) et que les monstres le sont aussi (Alchimiste 1).
