-- Noir // monochrome colorscheme for LazyVim and stock Neovim.
-- No external theme plugin is required.
vim.cmd("highlight clear")
if vim.fn.exists("syntax_on") == 1 then vim.cmd("syntax reset") end
vim.o.background = "dark"
vim.g.colors_name = "noir"

local p = {
  bg = "#000000", panel = "#0c0c0e", surface = "#121215", border = "#29292f",
  bright_border = "#4a4a52", fg = "#eeeeee", muted = "#9999a1", dim = "#66666e",
  white = "#ffffff", accent = "#cfcfcf", blue = "#aebdca", cyan = "#b8c6c6",
  green = "#b8c2b8", yellow = "#d0c8ad", orange = "#c8b8a8", red = "#c5a8a8",
  purple = "#b9b0c5",
}

local state_path = vim.fn.expand("~/.config/noir-rice/nvim.json")
if vim.fn.filereadable(state_path) == 1 then
  local ok, state = pcall(vim.fn.json_decode, table.concat(vim.fn.readfile(state_path), "\n"))
  if ok and type(state) == "table" then
    p.bg = state.transparent and "NONE" or (state.background or p.bg)
    p.accent = state.accent or p.accent
    p.dim = state.comment or p.dim
    vim.opt.cursorline = state.cursorline ~= false
    vim.opt.relativenumber = state.relative_numbers == true
  end
end

local function hi(group, opts) vim.api.nvim_set_hl(0, group, opts) end

-- Editor and window chrome.
for group, opts in pairs({
  Normal = { fg = p.fg, bg = p.bg }, NormalFloat = { fg = p.fg, bg = p.surface },
  FloatBorder = { fg = p.bright_border, bg = p.surface }, SignColumn = { fg = p.dim, bg = p.bg },
  FoldColumn = { fg = p.dim, bg = p.bg }, CursorLine = { bg = "#0d0d10" },
  CursorColumn = { bg = "#0d0d10" }, ColorColumn = { bg = p.surface },
  CursorLineNr = { fg = p.white, bold = true }, LineNr = { fg = p.dim },
  VertSplit = { fg = p.border, bg = p.bg }, WinSeparator = { fg = p.border, bg = p.bg },
  StatusLine = { fg = p.fg, bg = p.panel }, StatusLineNC = { fg = p.dim, bg = p.panel },
  TabLine = { fg = p.muted, bg = p.panel }, TabLineSel = { fg = p.bg, bg = p.accent, bold = true },
  TabLineFill = { bg = p.panel }, Title = { fg = p.white, bold = true }, Directory = { fg = p.blue },
  NonText = { fg = "#303038" }, Whitespace = { fg = "#24242a" }, SpecialKey = { fg = p.dim },
}) do hi(group, opts) end

-- Selection, search, completion, and diagnostics.
for group, opts in pairs({
  Visual = { bg = "#303038" }, VisualNOS = { bg = "#303038" }, Search = { fg = p.bg, bg = p.accent },
  IncSearch = { fg = p.bg, bg = p.white, bold = true }, CurSearch = { fg = p.bg, bg = p.white, bold = true },
  MatchParen = { fg = p.white, bg = "#3a3a42", bold = true }, Pmenu = { fg = p.fg, bg = p.surface },
  PmenuSel = { fg = p.bg, bg = p.accent, bold = true }, PmenuSbar = { bg = p.border },
  PmenuThumb = { bg = p.bright_border }, WildMenu = { fg = p.bg, bg = p.accent }, Question = { fg = p.green },
  ErrorMsg = { fg = p.red }, WarningMsg = { fg = p.yellow }, DiagnosticError = { fg = p.red },
  DiagnosticWarn = { fg = p.yellow }, DiagnosticInfo = { fg = p.blue }, DiagnosticHint = { fg = p.cyan },
  DiagnosticUnderlineError = { undercurl = true, sp = p.red }, DiagnosticUnderlineWarn = { undercurl = true, sp = p.yellow },
}) do hi(group, opts) end

-- Restrained monochrome-adjacent syntax palette.
for group, opts in pairs({
  Comment = { fg = p.dim, italic = true }, Constant = { fg = p.purple }, String = { fg = p.green },
  Character = { fg = p.green }, Number = { fg = p.orange }, Boolean = { fg = p.orange, bold = true },
  Float = { fg = p.orange }, Identifier = { fg = p.fg }, Function = { fg = p.blue },
  Statement = { fg = p.white, bold = true }, Conditional = { fg = p.purple, bold = true },
  Repeat = { fg = p.purple, bold = true }, Label = { fg = p.cyan }, Operator = { fg = p.accent },
  Keyword = { fg = p.purple }, Exception = { fg = p.red, bold = true }, PreProc = { fg = p.cyan },
  Include = { fg = p.cyan }, Define = { fg = p.cyan }, Macro = { fg = p.cyan }, Type = { fg = p.yellow },
  StorageClass = { fg = p.yellow }, Structure = { fg = p.yellow }, Typedef = { fg = p.yellow },
  Special = { fg = p.cyan }, SpecialChar = { fg = p.cyan }, Tag = { fg = p.blue }, Delimiter = { fg = p.muted },
  Error = { fg = p.red, bold = true }, Todo = { fg = p.bg, bg = p.yellow, bold = true },
}) do hi(group, opts) end

for group, target in pairs({
  ["@comment"] = "Comment", ["@string"] = "String", ["@string.escape"] = "SpecialChar",
  ["@constant"] = "Constant", ["@number"] = "Number", ["@boolean"] = "Boolean",
  ["@function"] = "Function", ["@function.call"] = "Function", ["@method"] = "Function",
  ["@keyword"] = "Keyword", ["@keyword.return"] = "Statement", ["@type"] = "Type",
  ["@variable"] = "Identifier", ["@property"] = "Identifier", ["@operator"] = "Operator",
  ["@punctuation.delimiter"] = "Delimiter", ["@punctuation.bracket"] = "Delimiter",
  ["@tag"] = "Tag", ["@tag.attribute"] = "Identifier", ["@markup.heading"] = "Title",
  ["@markup.raw"] = "String", ["@markup.link"] = "Underlined",
}) do hi(group, { link = target }) end

-- LazyVim's most visible plugin surfaces.
for group, opts in pairs({
  GitSignsAdd = { fg = p.green }, GitSignsChange = { fg = p.yellow }, GitSignsDelete = { fg = p.red },
  MiniStatuslineFilename = { fg = p.fg, bg = p.panel }, MiniStatuslineDevinfo = { fg = p.muted, bg = p.surface },
  TelescopeBorder = { fg = p.bright_border, bg = p.surface }, TelescopeNormal = { fg = p.fg, bg = p.surface },
  TelescopePromptBorder = { fg = p.accent, bg = p.surface }, TelescopePromptTitle = { fg = p.bg, bg = p.accent, bold = true },
  TelescopeSelection = { bg = "#25252b", bold = true }, NeoTreeNormal = { fg = p.fg, bg = p.panel },
  NeoTreeNormalNC = { fg = p.muted, bg = p.panel }, NeoTreeDirectoryIcon = { fg = p.blue },
  BlinkCmpMenu = { fg = p.fg, bg = p.surface }, BlinkCmpMenuSelection = { fg = p.bg, bg = p.accent },
  LspReferenceText = { bg = "#24242a" }, LspReferenceRead = { bg = "#24242a" },
  LspReferenceWrite = { bg = "#303038", underline = true },
}) do hi(group, opts) end
