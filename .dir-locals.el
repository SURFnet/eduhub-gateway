;;; Directory Local Variables
;;; For more information see (info "(emacs) Directory Variables")

((js-mode
  (js-indent-level . 2))
 (js2-mode
  (js2-strict-missing-semi-warning . nil))
 ;; use provided `standard` checker for javascript
 (nil . ((eval . (setq flycheck-javascript-standard-executable
                       (concat (projectile-project-root) "/node_modules/.bin/standard"))))))
