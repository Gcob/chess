export default {
  app: {
    title: 'Jeu d\'échecs',
  },
  common: {
    back: 'Retour',
    close: 'Fermer',
  },
  settings: {
    title: 'Paramètres',
    toggleTheme: 'Changer le thème',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    sound: 'Effets sonores',
    boardTheme: 'Thème du plateau',
    pieceStyle: 'Style des pièces'
  },
  home: {
    subtitle: 'Un jeu d\'échecs simple construit avec Vue 3',
    playButton: 'Nouvelle partie',
    "rulesButton": "Comment jouer"
  },
  newGame: {
    title: 'Nouvelle partie',
    subtitle: 'Configure ta partie avant de commencer.',
    startButton: 'Commencer',
  },
  chessRules: {
    "title": "Comment jouer aux échecs",
    "objectiveTitle": "Objectif",
    "objectiveText": "Le but des échecs est de mettre le roi adverse en échec et mat. Cela signifie que le roi est attaqué et n'a aucun moyen d'échapper à la capture au prochain coup.",
    "setupTitle": "Mise en place",
    "setupText": "Le plateau est une grille de 8×8 cases alternant cases claires et foncées. Chaque joueur commence avec 16 pièces : un roi, une dame, deux tours, deux fous, deux cavaliers et huit pions. Le plateau est placé de sorte que chaque joueur ait une case claire dans le coin inférieur droit.",
    "piecesTitle": "Déplacement des pièces",
    "king": "Roi ♚",
    "kingText": "Se déplace d'une case dans n'importe quelle direction. La pièce la plus importante — s'il est mis en échec et mat, vous perdez.",
    "queen": "Dame ♛",
    "queenText": "Se déplace d'autant de cases que souhaité dans toutes les directions — horizontalement, verticalement ou en diagonale. La pièce la plus puissante du plateau.",
    "rook": "Tour ♜",
    "rookText": "Se déplace d'autant de cases que souhaité horizontalement ou verticalement.",
    "bishop": "Fou ♝",
    "bishopText": "Se déplace d'autant de cases que souhaité en diagonale. Chaque fou reste sur sa couleur de départ pour toute la partie.",
    "knight": "Cavalier ♞",
    "knightText": "Se déplace en forme de L : deux cases dans une direction et une case perpendiculairement. La seule pièce pouvant sauter par-dessus les autres pièces.",
    "pawn": "Pion ♟",
    "pawnText": "Avance d'une case, ou de deux cases depuis sa position de départ. Capture en diagonale d'une case vers l'avant. Si un pion atteint l'extrémité opposée du plateau, il doit être promu en une autre pièce.",
    "specialTitle": "Coups spéciaux",
    "castling": "Roque",
    "castlingText": "Un coup spécial impliquant le roi et une tour. Le roi se déplace de deux cases vers une tour, et la tour saute de l'autre côté du roi. Possible uniquement si aucune des deux pièces n'a bougé, les cases entre elles sont vides, et le roi n'est ni en échec ni ne traverse une case en échec.",
    "enPassant": "Prise en passant",
    "enPassantText": "Si un pion avance de deux cases depuis sa position de départ et se retrouve à côté d'un pion adverse, l'adversaire peut le capturer comme s'il n'avait avancé que d'une case. Cela doit être fait immédiatement au coup suivant.",
    "promotion": "Promotion",
    "promotionText": "Lorsqu'un pion atteint l'extrémité opposée du plateau, il doit être promu en dame, tour, fou ou cavalier. La plupart des joueurs choisissent la dame.",
    "endTitle": "Fin de la partie",
    "endText": "La partie se termine par un échec et mat, une abandon ou une nulle. Une nulle peut survenir par pat (aucun coup légal mais pas en échec), répétition triple, la règle des cinquante coups, matériel insuffisant ou accord mutuel."
  },
}
