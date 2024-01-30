import db from '../config/database'
import MacroController from '../controllers/macro.controller'
import { validateDiceString } from '../utils/DiceRoller.js'
import { Macro_Name } from '../types/validations'

enum Macro_Type {
    NORMAL = 0,
    MODIFIER_PLUS = 1,
    MODIFIER_MINUS = 2,
}

type PreparedMacro = {
    user_id: number
    macro_name: Macro_Name
    is_public: boolean
    macros: {}
}

type PreparedMacroUpdate = {
    macro_name: Macro_Name
    is_public: boolean
    macros: {}
}

class MacroServices {
    private macroController: MacroController
    private textRegex: RegExp
    constructor() {
        this.macroController = new MacroController(db)
        this.textRegex =
            /^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ+#@$%&*{}()/.,;:?!'"-_| ]{1,}(?: [a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ+#@$%&*{}()/.,;:?!'"-_| ]+){0,}$/gim
    }

    async validate(body: any): Promise<Array<{ field: string; message: string }>> {
        const errors: Array<{ field: string; message: string }> = []

        if (!body.macroName) {
            errors.push({ field: 'macro_name', message: 'Faltando nome do macro' })
        }

        if (Macro_Name.isValid(body.macroName) === false) {
            errors.push({ field: 'macro_name', message: 'Nome do macro inválido' })
        }

        const macro = await this.macroController.getByUserIdAndMacroName(body.user_id, `${body.macro_name}`)

        if (macro) {
            errors.push({ field: 'macro_name', message: 'Já existe um macro com esse nome' })
        }

        return errors
    }

    async prepareMacro(body: any, userId: number): Promise<PreparedMacro> {
        return {
            user_id: userId,
            macro_name: new Macro_Name(body.macroName),
            macros: { sections: [{ name: 'Macros', position: 0, macros: [] }] },
            is_public: false,
        }
    }

    async validateUpdate(body: Macro): Promise<Array<{ field: string; message: string }>> {
        const errors: Array<{ field: string; message: string }> = []

        if (!body.macro_name) {
            errors.push({ field: 'macro_name', message: 'Faltando nome do macro' })
        }

        if (Macro_Name.isValid(`${body.macro_name}`) === false) {
            errors.push({ field: 'macro_name', message: 'Nome do macro inválido' })
        }

        const macro = await this.macroController.getByUserIdAndMacroName(body.user_id, `${body.macro_name}`)

        if (macro && macro.id !== body.id) {
            errors.push({ field: 'macro_name', message: 'Já existe um macro com esse nome' })
        }

        const macroExists = await this.macroController.getById(body.id)

        if (macroExists === null) {
            errors.push({ field: 'macro_name', message: 'Macro não existe' })
        } else {
            if (macroExists.user_id !== body.user_id) {
                errors.push({ field: 'macro_name', message: 'Macro não pertence ao usuário' })
            }
        }

        body.macros.sections.forEach((section, sectionIndex) => {
            if (section.name.length == 0) {
                errors.push({
                    field: 'sections',
                    message: 'Nome da seção inválido',
                })
            }

            if (section.name.length < 2 || section.name.length > 20) {
                errors.push({
                    field: 'sections',
                    message: 'Nome da seção deve ter entre 2 e 20 caracteres',
                })
            }

            if (!section.name.match(this.textRegex)) {
                errors.push({
                    field: 'sections',
                    message: 'Nome da seção inválido',
                })
            }

            if (body.macros.sections.find(s => s.name === section.name && s.position !== section.position)) {
                errors.push({
                    field: 'sections',
                    message: 'Nome da seção duplicado',
                })
            }

            section.macros.forEach(macro => {
                if (macro.name.length == 0) {
                    errors.push({
                        field: 'macros',
                        message: 'Nome do macro não pode ser vazio',
                    })
                }

                if (macro.name.length > 32) {
                    errors.push({
                        field: 'macros',
                        message: 'Nome do macro deve ter no máximo 32 caracteres',
                    })
                }

                if (!macro.name.match(this.textRegex)) {
                    errors.push({
                        field: 'macros',
                        message: 'Nome do macro inválido',
                    })
                }

                if (body.macros.sections[sectionIndex].macros.find(a => a.name === macro.name && a.position !== macro.position)) {
                    errors.push({
                        field: 'macros',
                        message: 'Nome do macro duplicado',
                    })
                }

                macro.value = `${macro.value}`

                if (macro.value.length == 0) {
                    errors.push({
                        field: 'macros',
                        message: 'Valor do macro não pode ser vazio',
                    })
                }

                if (macro.value.length > 128) {
                    errors.push({
                        field: 'macros',
                        message: 'Valor do macro deve ter no máximo 128 caracteres',
                    })
                }

                if (!validateDiceString(macro.value)) {
                    errors.push({
                        field: 'macros',
                        message: 'Valor do macro inválido',
                    })
                }
            })
        })

        return errors
    }

    async prepareMacroUpdate(body: Macro): Promise<PreparedMacroUpdate> {
        return {
            macro_name: body.macro_name,
            macros: body.macros,
            is_public: body.is_public,
        }
    }
}

export default MacroServices
