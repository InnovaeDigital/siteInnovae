# Regras do Firebase

No Firebase Console, habilite **Authentication > Sign-in method > E-mail/Senha**.

Em **Firestore Database > Rules**, publique:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  match /quotes/{quoteId} {
      // O cliente abre somente um orçamento pelo link recebido.
      allow get: if true;
      // A lista do painel só retorna orçamentos da própria conta.
      allow list: if request.auth != null
        && request.query.where.ownerId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid
        && request.resource.data.ownerId == request.auth.uid;
    }

    match /users/{userId} {
      // A tela de login precisa listar apenas os nomes e e-mails cadastrados.
      allow read: if true;
      // Somente uma sessão autenticada pode cadastrar o perfil de uma nova conta.
      allow create: if request.auth != null
        && request.resource.data.uid == userId
        && request.resource.data.email is string
        && request.resource.data.displayName is string;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
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
