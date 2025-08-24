import * as yup from 'yup';

// Schema para contato (adicionar e editar) - seguindo o DTO do backend
export const contactSchema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  
  categoria: yup
    .string()
    .optional()
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),
  
  telefone: yup
    .string()
    .required('Telefone é obrigatório')
    .transform((value) => {
      // Normaliza para apenas dígitos para validação e envio
      if (!value) return '';
      return String(value).replace(/\D/g, '');
    })
    .test('telefone-11-digitos', 'Telefone deve ter 11 dígitos (ex: 21999735627)', (value) => {
      return typeof value === 'string' && value.length === 11;
    }),
  
  email: yup
    .string()
    .optional()
    .email('Email deve ter um formato válido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
    
  foto: yup
    .string()
    .optional(),
});

// Schema para login
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail inválido'),
  
  senha: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema para cadastro
export const cadastroSchema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  
  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail inválido'),
  
  senha: yup
    .string()
    .required('Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .matches(
      /^(?=.*[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
      'Senha deve conter pelo menos um número ou símbolo'
    ),
  
  repetirSenha: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('senha')], 'As senhas devem ser iguais'),
});

export type ContactFormData = {
  nome: string;
  telefone: string;
  categoria: string | undefined;
  email: string | undefined;
  foto: string | undefined; // Base64 string
};

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type CadastroFormData = yup.InferType<typeof cadastroSchema>;

// Schema para troca de senha
export const changePasswordSchema = yup.object({
  senhaAtual: yup
    .string()
    .required('Senha atual é obrigatória'),
  novaSenha: yup
    .string()
    .required('Nova senha é obrigatória')
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .notOneOf([yup.ref('senhaAtual')], 'Nova senha deve ser diferente da atual'),
  confirmarNovaSenha: yup
    .string()
    .required('Confirmação de nova senha é obrigatória')
    .oneOf([yup.ref('novaSenha')], 'As senhas devem ser iguais'),
});

export type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;
