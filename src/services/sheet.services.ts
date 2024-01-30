import db from '../config/database'
import SheetController from '../controllers/sheet.controller'
import { Sheet_Name } from '../types/validations'
import { generateSheetPassword } from '../utils'

enum Attribute_Type {
    TEXT = 0,
    NUMBER = 1,
    IMAGE = 2,
    LIST = 3,
    BAR = 4,
}

type PreparedSheet = {
    sheet_name: Sheet_Name
    user_id: number
    sheet_password: string
    is_public: boolean
    attributes: {}
    legacy: false
    last_use: Date
}

type PreparedSheetUpdate = {
    sheet_name: Sheet_Name
    is_public: boolean
    attributes: {}
    legacy: false
    last_use: Date
}

class SheetServices {
    private sheetController: SheetController
    private textRegex: RegExp
    private numberRegex: RegExp
    private positiveNumberRegex: RegExp
    private imageRegex: RegExp
    constructor() {
        this.sheetController = new SheetController(db)
        this.textRegex =
            /^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ+#@$%&*{}()/.,;:?!'"-_| ]{1,}(?: [a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ+#@$%&*{}()/.,;:?!'"-_| ]+){0,}$/gim
        this.numberRegex = /^(-?[0-9]+)$/gim
        this.positiveNumberRegex = /^([0-9]+)$/gim
        this.imageRegex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp)/gi
    }

    async validate(body: any): Promise<Array<{ field: string; message: string }>> {
        const errors: Array<{ field: string; message: string }> = []

        if (!body.sheetName) {
            errors.push({
                field: 'sheet_name',
                message: 'Faltando nome da ficha',
            })

            return errors
        }

        if (Sheet_Name.isValid(body.sheetName) === false) {
            errors.push({
                field: 'sheet_name',
                message: 'Nome da ficha inválido',
            })
        }

        const sheet = await this.sheetController.getByUserIdAndSheetName(body.user_id, body.sheetName)

        if (sheet) {
            errors.push({
                field: 'sheet_name',
                message: 'Esta ficha já existe',
            })
        }

        return errors
    }

    async prepareSheet(body: any, userId: number): Promise<PreparedSheet> {
        return {
            sheet_name: new Sheet_Name(body.sheetName),
            user_id: userId,
            sheet_password: generateSheetPassword(),
            is_public: body.is_public ? body.is_public : false,
            attributes: { sections: [{ name: 'Info', type: 0, position: 0, attributes: [] }] },
            legacy: false,
            last_use: new Date(),
        }
    }

    async validateUpdate(body: Sheet): Promise<Array<{ field: string; message: string }>> {
        const errors: Array<{ field: string; message: string }> = []

        if (!body.sheet_name) {
            errors.push({
                field: 'sheet_name',
                message: 'Faltando nome da ficha',
            })
        }

        if (Sheet_Name.isValid(`${body.sheet_name}`) === false) {
            errors.push({
                field: 'sheet_name',
                message: 'Nome da ficha inválido',
            })
        }

        const sheet = await this.sheetController.getByUserIdAndSheetName(body.user_id, `${body.sheet_name}`)

        if (sheet && sheet.id !== body.id) {
            errors.push({
                field: 'sheet_name',
                message: 'Já existe uma ficha com este nome para este usuário',
            })
        }

        const sheetExists = await this.sheetController.getById(body.id)

        if (sheetExists == null) {
            errors.push({
                field: 'sheet_name',
                message: 'Ficha não encontrada',
            })
        } else {
            if (sheetExists.user_id !== body.user_id) {
                errors.push({
                    field: 'sheet_name',
                    message: 'Ficha não pertence ao usuário',
                })
            }
        }

        body.attributes.sections.forEach((section, sectionIndex) => {
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

            if (body.attributes.sections.find(s => s.name === section.name && s.position !== section.position)) {
                errors.push({
                    field: 'sections',
                    message: 'Nome da seção duplicado',
                })
            }

            section.attributes.forEach(attribute => {
                if (parseInt(`${attribute.type}`) !== Attribute_Type.IMAGE) {
                    if (attribute.name.length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Nome do atributo não pode ser vazio',
                        })
                    }

                    if (attribute.name.length > 32) {
                        errors.push({
                            field: 'attributes',
                            message: 'Nome do atributo deve ter no máximo 32 caracteres',
                        })
                    }

                    if (!attribute.name.match(this.textRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Nome do atributo inválido',
                        })
                    }

                    if (body.attributes.sections[sectionIndex].attributes.find(a => a.name === attribute.name && a.position !== attribute.position)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Nome do atributo duplicado',
                        })
                    }
                }

                if (parseInt(`${attribute.type}`) === Attribute_Type.TEXT) {
                    attribute.value = `${attribute.value}`
                    if (attribute.value.length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attribute.value.length > 1024) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo deve ter no máximo 1024 caracteres',
                        })
                    }

                    if (!attribute.value.match(this.textRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }
                } else if (parseInt(`${attribute.type}`) === Attribute_Type.NUMBER) {
                    attribute.value = `${attribute.value}`
                    if (attribute.value.length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attribute.value.length > 1024) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo deve ter no máximo 32 caracteres',
                        })
                    }

                    if (!attribute.value.match(this.numberRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }
                } else if (parseInt(`${attribute.type}`) === Attribute_Type.LIST) {
                    const attributeValue: { items: Array<{ quantity: number; name: string }> } = attribute.value as any

                    if (!Array.isArray(attributeValue.items)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Lista de itens inválida',
                        })
                    }

                    attributeValue.items.forEach((item: { quantity: number; name: string }) => {
                        if (item.name.length == 0) {
                            errors.push({
                                field: 'attributes',
                                message: 'Item da lista não pode ser vazio',
                            })
                        }

                        if (item.name.length > 1024) {
                            errors.push({
                                field: 'attributes',
                                message: 'Item da lista deve ter no máximo 32 caracteres',
                            })
                        }

                        if (!item.name.match(this.textRegex)) {
                            errors.push({
                                field: 'attributes',
                                message: 'Item da lista inválido',
                            })
                        }

                        if (item.quantity.toString().length == 0) {
                            errors.push({
                                field: 'attributes',
                                message: 'Quantidade do item da lista não pode ser vazio',
                            })
                        }

                        if (item.quantity.toString().length > 32) {
                            errors.push({
                                field: 'attributes',
                                message: 'Quantidade do item da lista deve ter no máximo 32 caracteres',
                            })
                        }

                        if (!item.quantity.toString().match(this.positiveNumberRegex)) {
                            errors.push({
                                field: 'attributes',
                                message: 'Quantidade do item da lista inválido',
                            })
                        }
                    })
                } else if (parseInt(`${attribute.type}`) === Attribute_Type.IMAGE) {
                    attribute.value = `${attribute.value}`
                    if (attribute.value.length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (!attribute.value.match(this.imageRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'O valor do atributo deve ser um URL de imagem válido',
                        })
                    }
                } else if (parseInt(`${attribute.type}`) === Attribute_Type.BAR) {
                    const attributeValue: { actual: number; min: number; max: number; step: number } = attribute.value as any

                    if (attributeValue.actual.toString().length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attributeValue.max.toString().length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attributeValue.min.toString().length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attributeValue.step.toString().length == 0) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo não pode ser vazio',
                        })
                    }

                    if (attributeValue.actual.toString().length > 32) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo deve ter no máximo 32 caracteres',
                        })
                    }

                    if (!attributeValue.actual.toString().match(this.numberRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }

                    if (!attributeValue.max.toString().match(this.numberRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }

                    if (!attributeValue.min.toString().match(this.numberRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }

                    if (!attributeValue.step.toString().match(this.positiveNumberRegex)) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do atributo inválido',
                        })
                    }

                    if (attributeValue.actual < attributeValue.min) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor atual não pode ser menor que o mínimo',
                        })
                    }

                    if (attributeValue.actual > attributeValue.max) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor atual não pode ser maior que o máximo',
                        })
                    }

                    if (attributeValue.min > attributeValue.max) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor mínimo não pode ser maior que o máximo',
                        })
                    }

                    if (attributeValue.step < 1) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do passo não pode ser menor que 1',
                        })
                    }

                    if (attributeValue.step > attributeValue.max) {
                        errors.push({
                            field: 'attributes',
                            message: 'Valor do passo não pode ser maior que o máximo',
                        })
                    }
                }
            })
        })

        return errors
    }

    async prepareSheetUpdate(body: Sheet): Promise<PreparedSheetUpdate> {
        return {
            sheet_name: new Sheet_Name(`${body.sheet_name}`),
            is_public: body.is_public ? body.is_public : false,
            attributes: body.attributes,
            legacy: false,
            last_use: new Date(),
        }
    }
}

export default SheetServices
