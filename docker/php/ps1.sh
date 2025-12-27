#!/bin/bash

# UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Couleurs ANSI (brutes, sans wrappers \[ \])
# Utilisation de $'\e' pour que bash interprète le code d'échappement
RESET=$'\e[0m'
FG_WHITE=$'\e[97m'
FG_DARK_GRAY=$'\e[90m'
FG_DARKER_GRAY=$'\e[38;5;240m'
FG_BLACK=$'\e[30m'

BG_WHITE=$'\e[48;5;255m'
BG_BLUE=$'\e[48;5;33m'
BG_GRAY=$'\e[48;5;240m'
BG_PURPLE=$'\e[48;5;98m'
BG_YELLOW=$'\e[48;5;220m'
BG_RESET=$'\e[49m' # Réinitialise UNIQUEMENT le fond

SEP_WHITE=$'\e[38;5;255m'
SEP_BLUE=$'\e[38;5;33m'
SEP_GRAY=$'\e[38;5;240m'
SEP_PURPLE=$'\e[38;5;98m'
SEP_YELLOW=$'\e[38;5;220m'

##
# Fonction pour parser la branche Git ET appliquer la couleur
##
parse_git_branch_with_color() {
  # 1. Utilise 'git symbolic-ref' pour obtenir le nom (ex: 'master')
  #    même avant le premier commit.
  local branch=$(git symbolic-ref --short HEAD 2>/dev/null)

  # 2. Si 'branch' est vide, on n'est pas dans un repo.
  if [ -z "$branch" ]; then
    # Pas un repo git.
    # 1. Affiche le separateur jaune
    # 2. Réinitialise le fond pour que le '↪' n'ait pas de fond jaune
    printf "%s%s" "${SEP_YELLOW}" "${BG_RESET}"
    return
  fi

  # 3. Vérifie "dirty" (modifié, stagé, ou non-suivi)
  local dirty_marker=""
  if ! git diff --quiet 2>/dev/null || \
     ! git diff --cached --quiet 2>/dev/null || \
     git status --porcelain 2>/dev/null | grep -q "^??"; then
    dirty_marker=" *"
  fi

  # 4. Formate et affiche le bloc bleu complet
  printf "%s%s%s%s %s%s %s" \
    "${SEP_YELLOW}" \
    "${SEP_BLUE}" "${BG_BLUE}" "${FG_WHITE}" \
    "${branch}${dirty_marker} " \
    "${RESET}" # Reset complet à la fin du bloc
}


# --- MODIFIÉ ---
# 1. Les variables n'ont plus les wrappers.
# 2. On AJOUTE les wrappers \[ et \] autour des variables statiques
#    directement dans la définition de PS1.
export PS1="\[${BG_BLUE}\]\[${FG_BLACK}\] 🐳 ${USER} \[${SEP_BLUE}\]"\
"\[${BG_GRAY}\]\[${FG_WHITE}\] \u@\h \[${SEP_GRAY}\]"\
"\[${BG_YELLOW}\]\[${FG_DARKER_GRAY}\] \w "\
"\$(parse_git_branch_with_color)"\
"\[${FG_DARK_GRAY}\] ↪ \[${RESET}\]"\
" " # Espace final

