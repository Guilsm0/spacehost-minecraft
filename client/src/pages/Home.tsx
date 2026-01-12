import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Rocket, Server, Zap, Shield, Cloud, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                SpaceHost
              </h1>
            </div>
            
            <nav className="flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Olá, <span className="text-foreground font-medium">{user?.name || user?.email}</span>
                  </span>
                  <Link href="/dashboard">
                    <Button>
                      Meus Servidores
                    </Button>
                  </Link>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button>
                    Entrar
                  </Button>
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary">
              🚀 Hospedagem Gratuita de Servidores Minecraft
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Leve seu servidor Minecraft para o espaço
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Crie e gerencie servidores Minecraft gratuitamente com tecnologia de ponta. 
              Console interativo, backups automáticos e muito mais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-6 group">
                    Acessar Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8 py-6 group">
                    Começar Agora
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              )}
              
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Ver Recursos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seus servidores Minecraft de forma profissional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Server className="w-8 h-8" />}
              title="Criação Instantânea"
              description="Crie servidores Minecraft em segundos com suporte para Vanilla, Spigot, Paper, Forge e Fabric."
            />
            
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Console Interativo"
              description="Execute comandos em tempo real e visualize logs do servidor com interface intuitiva."
            />
            
            <FeatureCard
              icon={<Cloud className="w-8 h-8" />}
              title="Backups Automáticos"
              description="Seus mundos protegidos com backups automáticos agendados e armazenamento seguro na nuvem."
            />
            
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Gerenciamento de Jogadores"
              description="Whitelist, operadores, banimentos e permissões em um painel completo."
            />
            
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Plugins & Mods"
              description="Busque e instale plugins e mods diretamente do CurseForge e Modrinth."
            />
            
            <FeatureCard
              icon={<Rocket className="w-8 h-8" />}
              title="Endereço Personalizado"
              description="Cada servidor recebe um endereço único no formato seu-servidor.spacehost.cloud"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/30 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para decolar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Crie seu primeiro servidor Minecraft gratuitamente em menos de 1 minuto
            </p>
            
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6">
                  Criar Meu Servidor
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8 py-6">
                  Começar Gratuitamente
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-primary" />
              <span className="font-bold">SpaceHost</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2026 SpaceHost. Hospedagem gratuita de servidores Minecraft.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10">
      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
