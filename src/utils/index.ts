function generateSheetPassword() {
    return Math.random().toString(36).slice(-8)
}

export { generateSheetPassword }
