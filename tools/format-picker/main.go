package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type option struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Extension string `json:"extension"`
}

type payload struct {
	Prompt    string   `json:"prompt"`
	Query     string   `json:"query"`
	Preferred string   `json:"preferred"`
	Options   []option `json:"options"`
}

type scoredOption struct {
	option option
	score  int
}

type model struct {
	prompt    string
	query     string
	preferred string
	all       []option
	filtered  []option
	cursor    int
	selected  *option
	cancelled bool
	width     int
	height    int
}

var (
	frameStyle = lipgloss.NewStyle().
			Padding(0, 1)

	headerStyle = lipgloss.NewStyle().
			Bold(true)

	promptStyle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "241", Dark: "248"})

	hintStyle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "245", Dark: "240"})

	selectedStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.AdaptiveColor{Light: "39", Dark: "117"})

	rowStyle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "250", Dark: "252"})

	footerStyle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "245", Dark: "240"})

	emptyStyle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "203", Dark: "210"})
)

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			m.cancelled = true
			return m, tea.Quit
		case "enter":
			if len(m.filtered) == 0 {
				return m, nil
			}
			selected := m.filtered[m.cursor]
			m.selected = &selected
			return m, tea.Quit
		case "up", "k", "ctrl+p":
			if m.cursor > 0 {
				m.cursor--
			}
			return m, nil
		case "down", "j", "ctrl+n":
			if m.cursor < len(m.filtered)-1 {
				m.cursor++
			}
			return m, nil
		case "backspace", "ctrl+h":
			if len(m.query) == 0 {
				return m, nil
			}
			m.query = m.query[:len(m.query)-1]
			m.refilter()
			return m, nil
		}

		if msg.Type == tea.KeyRunes {
			m.query += msg.String()
			m.refilter()
		}
	}

	return m, nil
}

func (m model) View() string {
	var builder strings.Builder
	line := fmt.Sprintf("%s > %s", promptStyle.Render(m.prompt), m.query)
	builder.WriteString(headerStyle.Render(line))
	builder.WriteString("\n")
	if m.query == "" && m.preferred != "" {
		builder.WriteString(hintStyle.Render(fmt.Sprintf("hint: original extension '.%s' is ranked first", m.preferred)))
		builder.WriteString("\n")
	}

	if len(m.filtered) == 0 {
		builder.WriteString(emptyStyle.Render("no matches"))
		builder.WriteString("\n")
		builder.WriteString(footerStyle.Render("keys: type to search, backspace delete, esc cancel"))
		return frameStyle.Render(builder.String())
	}

	maxRows := 8
	if m.height > 6 {
		maxRows = m.height - 4
	}
	if maxRows < 4 {
		maxRows = 4
	}
	if maxRows > len(m.filtered) {
		maxRows = len(m.filtered)
	}

	start := 0
	if m.cursor >= maxRows {
		start = m.cursor - maxRows + 1
	}

	end := start + maxRows
	if end > len(m.filtered) {
		end = len(m.filtered)
	}

	for index := start; index < end; index++ {
		prefix := "  "
		style := rowStyle
		if index == m.cursor {
			prefix = "> "
			style = selectedStyle
		}
		item := m.filtered[index]
		line := fmt.Sprintf("%s%-10s .%-6s %s", prefix, item.ID, item.Extension, item.Name)
		builder.WriteString(style.Render(line))
		builder.WriteString("\n")
	}

	status := fmt.Sprintf("%d shown / %d total", len(m.filtered), len(m.all))
	if len(m.filtered) != len(m.all) {
		status = fmt.Sprintf("%d matches / %d total", len(m.filtered), len(m.all))
	}
	builder.WriteString(footerStyle.Render(status))
	builder.WriteString("\n")
	builder.WriteString(footerStyle.Render("keys: up/down move, enter select, esc cancel"))

	return frameStyle.Render(builder.String())
}

func (m *model) refilter() {
	query := strings.ToLower(strings.TrimSpace(m.query))
	scored := make([]scoredOption, 0, len(m.all))

	for _, item := range m.all {
		score := fuzzyScore(query, item, m.preferred)
		if score < 0 {
			continue
		}
		scored = append(scored, scoredOption{option: item, score: score})
	}

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].option.ID < scored[j].option.ID
		}
		return scored[i].score > scored[j].score
	})

	m.filtered = make([]option, 0, len(scored))
	for _, item := range scored {
		m.filtered = append(m.filtered, item.option)
	}

	if m.cursor >= len(m.filtered) {
		m.cursor = len(m.filtered) - 1
	}
	if m.cursor < 0 {
		m.cursor = 0
	}
}

func fuzzyScore(query string, item option, preferred string) int {
	if query == "" {
		score := 1
		if preferred != "" {
			normalizedPreferred := strings.ToLower(preferred)
			if strings.EqualFold(item.Extension, normalizedPreferred) {
				score += 25
			}
			if strings.EqualFold(item.ID, normalizedPreferred) {
				score += 20
			}
		}
		return score
	}

	candidate := strings.ToLower(item.ID + " " + item.Extension + " " + item.Name)
	queryRunes := []rune(query)
	candidateRunes := []rune(candidate)

	score := 0
	queryIndex := 0
	streak := 0
	lastMatch := -2

	for index, value := range candidateRunes {
		if queryIndex >= len(queryRunes) {
			break
		}
		if value != queryRunes[queryIndex] {
			continue
		}

		score += 10
		if index == lastMatch+1 {
			streak++
			score += 4 * streak
		} else {
			streak = 1
		}
		lastMatch = index
		queryIndex++
	}

	if queryIndex != len(queryRunes) {
		return -1
	}

	score -= len(candidateRunes) / 6
	if strings.HasPrefix(strings.ToLower(item.ID), query) {
		score += 15
	}
	if preferred != "" {
		normalizedPreferred := strings.ToLower(preferred)
		if strings.EqualFold(item.Extension, normalizedPreferred) {
			score += 8
		}
		if strings.EqualFold(item.ID, normalizedPreferred) {
			score += 6
		}
	}

	return score
}

func readPayload(path string) (payload, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return payload{}, err
	}

	var data payload
	if err := json.Unmarshal(raw, &data); err != nil {
		return payload{}, err
	}

	if data.Prompt == "" {
		data.Prompt = "output format"
	}
	if data.Query != "" {
		data.Query = strings.TrimSpace(data.Query)
	}
	data.Prompt = strings.TrimSpace(data.Prompt)
	return data, nil
}

func main() {
	optionsPath := flag.String("options", "", "path to JSON options payload")
	resultPath := flag.String("result", "", "path to output selected id")
	flag.Parse()

	if *optionsPath == "" || *resultPath == "" {
		fmt.Fprintln(os.Stderr, "usage: fconvert-picker --options <file> --result <file>")
		os.Exit(2)
	}

	data, err := readPayload(*optionsPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	picker := model{
		prompt:    data.Prompt,
		query:     data.Query,
		preferred: strings.TrimSpace(data.Preferred),
		all:       data.Options,
	}
	picker.refilter()

	program := tea.NewProgram(picker)
	result, err := program.Run()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	finalModel, ok := result.(model)
	if !ok {
		fmt.Fprintln(os.Stderr, "unexpected picker model type")
		os.Exit(1)
	}

	if finalModel.cancelled || finalModel.selected == nil {
		os.Exit(130)
	}

	if err := os.WriteFile(*resultPath, []byte(finalModel.selected.ID+"\n"), 0o644); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
