# Regras do Firebase

O login interno foi movido para validacao no proprio site. Para que os usuarios criados na area interna aparecam em todos os dispositivos, a colecao `users` precisa aceitar leitura e gravacao pelo site.

Em **Firestore Database > Rules**, publique:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  match /quotes/{quoteId} {
      // O cliente abre o orcamento pelo link recebido.
      allow get: if true;
      // O painel lista e salva orcamentos sem Firebase Auth.
      allow list: if true;
      allow create, update: if request.resource.data.id == quoteId
        && request.resource.data.ownerId is string
        && request.resource.data.clientName is string
        && request.resource.data.items is list;
      allow delete: if true;
    }

    match /users/{userId} {
      // A tela de login lista os usuarios cadastrados no banco.
      allow read: if true;
      // O site salva usuarios sem Firebase Auth, incluindo a senha em texto.
      allow create, update: if request.resource.data.uid == userId
        && request.resource.data.email is string
        && request.resource.data.displayName is string
        && request.resource.data.password is string;
      allow delete: if false;
    }
  }
}
```

Em **Storage > Rules**, publique:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /quote-references/{fileName} {
      // As imagens anexadas aparecem no link do cliente.
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Os links do cliente são identificadores longos e não listáveis pelo site público. Não use números de orçamento previsíveis como ID do documento.
