CREATE TABLE "clientes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clientes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"cpf" text NOT NULL,
	"telefone" text NOT NULL,
	"cep" text NOT NULL,
	"cidade" text NOT NULL,
	"estado" text NOT NULL,
	"endereco" text NOT NULL,
	"bairro" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "clientes_nome_check" CHECK (char_length("clientes"."nome") BETWEEN 1 AND 150),
	CONSTRAINT "clientes_cpf_check" CHECK ("clientes"."cpf" ~ '^[0-9]{11}$'),
	CONSTRAINT "clientes_telefone_check" CHECK ("clientes"."telefone" ~ '^[0-9]{10,11}$'),
	CONSTRAINT "clientes_cep_check" CHECK ("clientes"."cep" ~ '^[0-9]{8}$'),
	CONSTRAINT "clientes_cidade_check" CHECK (char_length("clientes"."cidade") BETWEEN 1 AND 100),
	CONSTRAINT "clientes_estado_check" CHECK ("clientes"."estado" ~ '^[A-Z]{2}$'),
	CONSTRAINT "clientes_endereco_check" CHECK (char_length("clientes"."endereco") BETWEEN 1 AND 200),
	CONSTRAINT "clientes_bairro_check" CHECK (char_length("clientes"."bairro") BETWEEN 1 AND 100),
	CONSTRAINT "clientes_numero_check" CHECK (char_length("clientes"."numero") BETWEEN 1 AND 20),
	CONSTRAINT "clientes_complemento_check" CHECK (char_length("clientes"."complemento") <= 100)
);
--> statement-breakpoint
CREATE INDEX "idx_clientes_nome" ON "clientes" USING btree (LOWER("nome"));