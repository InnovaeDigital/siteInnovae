# Segurança antes de publicar

O site não contém mais uma chave de escrita nem uma conta administrativa padrão. Isso impede que credenciais novas sejam expostas no navegador, mas o painel de operações só deve voltar a sincronizar dados depois de existir uma API privada.

## Ação imediata

1. Revogue a chave JSONBin que já foi usada e gere uma nova.
2. Apague ou torne privados os orçamentos antigos que foram criados como públicos.
3. Troque qualquer senha que tenha sido usada no painel anterior.
4. Faça um novo deploy: segredos que passaram pelo histórico do Git continuam comprometidos mesmo após a remoção do arquivo atual.

## Arquitetura necessária

Hospede uma API/serverless no mesmo domínio. Ela deve guardar `JSONBIN_ACCESS_KEY`, credenciais de administrador e uma chave de assinatura apenas nas variáveis de ambiente. O navegador deve chamar essa API autenticada; ele nunca deve falar com o JSONBin usando uma chave de escrita.

Para links de orçamento, mantenha os registros privados e entregue-os por um token assinado, com expiração e escopo apenas de leitura. Não use IDs públicos previsíveis.

## Observação

O painel atual funciona apenas localmente até essa API ser instalada. Essa interrupção é intencional: voltar a enviar a chave para o navegador restauraria a vulnerabilidade.
