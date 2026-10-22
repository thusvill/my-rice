if status is-interactive
    set -g fish_greeting
    set -gx TERMINAL kitty
    alias clear 'printf "\033[2J\033[3J\033[1;1H"'
end
