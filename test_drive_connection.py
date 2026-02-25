"""
Script de teste - Verificação da conexão com Google Drive via Service Account
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

CREDENTIALS_FILE = '/home/vinicius/Documentos/GED/credentials/gen-lang-client-0749797717-efad9c4dc0da.json'
SCOPES = ['https://www.googleapis.com/auth/drive']


def test_connection():
    print("=" * 60)
    print("TESTE DE CONEXÃO - Google Drive Service Account")
    print("=" * 60)

    # 1. Autenticação
    print("\n[1/4] Autenticando com a conta de serviço...")
    try:
        credentials = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=SCOPES
        )
        print(f"  ✓ Credenciais carregadas com sucesso")
        print(f"  ✓ Email: {credentials.service_account_email}")
        print(f"  ✓ Project ID: {credentials.project_id}")
    except Exception as e:
        print(f"  ✗ ERRO ao carregar credenciais: {e}")
        return

    # 2. Construir o serviço
    print("\n[2/4] Construindo serviço do Google Drive API...")
    try:
        drive_service = build('drive', 'v3', credentials=credentials)
        print(f"  ✓ Serviço construído com sucesso")
    except Exception as e:
        print(f"  ✗ ERRO ao construir serviço: {e}")
        return

    # 3. Testar chamada à API (listar arquivos)
    print("\n[3/4] Testando acesso à API (listando arquivos)...")
    try:
        results = drive_service.files().list(
            pageSize=10,
            fields="nextPageToken, files(id, name, mimeType, createdTime, owners)"
        ).execute()
        files = results.get('files', [])

        if not files:
            print("  ✓ API funcionando! Nenhum arquivo encontrado.")
            print("  ℹ  Isso é esperado se você ainda não compartilhou")
            print("     nenhuma pasta com a conta de serviço.")
            print(f"\n  → Compartilhe pastas/arquivos com:")
            print(f"    {credentials.service_account_email}")
        else:
            print(f"  ✓ API funcionando! {len(files)} arquivo(s) encontrado(s):\n")
            for f in files:
                tipo = "📁 Pasta" if f['mimeType'] == 'application/vnd.google-apps.folder' else "📄 Arquivo"
                print(f"    {tipo}: {f['name']}")
                print(f"       ID: {f['id']}")
                print(f"       Tipo: {f['mimeType']}")
                print()

    except HttpError as e:
        if e.resp.status == 403:
            print(f"  ✗ ERRO 403 - API do Google Drive não está ativada!")
            print(f"    → Vá no Google Cloud Console → APIs e serviços → Biblioteca")
            print(f"    → Pesquise 'Google Drive API' e clique em 'Ativar'")
        else:
            print(f"  ✗ ERRO HTTP {e.resp.status}: {e}")
        return
    except Exception as e:
        print(f"  ✗ ERRO inesperado: {e}")
        return

    # 4. Testar informações da conta
    print("\n[4/4] Verificando informações do Drive...")
    try:
        about = drive_service.about().get(fields="storageQuota, user").execute()
        user_info = about.get('user', {})
        quota = about.get('storageQuota', {})
        print(f"  ✓ Conta: {user_info.get('displayName', 'N/A')}")
        print(f"  ✓ Email: {user_info.get('emailAddress', 'N/A')}")
        if quota.get('limit'):
            used = int(quota.get('usage', 0)) / (1024**3)
            total = int(quota.get('limit', 0)) / (1024**3)
            print(f"  ✓ Armazenamento: {used:.2f} GB / {total:.2f} GB")
        else:
            print(f"  ✓ Armazenamento: sem limite definido (conta de serviço)")
    except Exception as e:
        print(f"  ⚠ Não foi possível obter info da conta: {e}")

    print("\n" + "=" * 60)
    print("RESULTADO: Conexão com Google Drive OK!")
    print("=" * 60)
    print(f"\nPróximos passos:")
    print(f"  1. Compartilhe pastas do seu Drive com:")
    print(f"     {credentials.service_account_email}")
    print(f"  2. Execute este script novamente para ver os arquivos")
    print(f"  3. Integre no FastAPI do projeto GED")


if __name__ == '__main__':
    test_connection()
