import { Op, Sequelize } from "sequelize";
import Message from "../../models/Message";
import * as unorm from "unorm";

interface SearchParams {
  ticketId: string;
  term: string;
  offset: number;
  limit: number;
  lastMessageId?: number;
}

const normalizeText = (text: string): string => {
  return unorm.nfd(text).replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const SearchMessagesService = async ({
  ticketId,
  term,
  offset,
  limit,
  lastMessageId,
}: SearchParams) => {
  
  // Normalizar o termo de busca
  const normalizedTerm = `%${normalizeText(term)}%`;

  // Configuração da consulta para o banco de dados
  const whereCondition = {
    ticketId,
    ...(lastMessageId && { id: { [Op.gt]: lastMessageId } }),
    [Op.and]: Sequelize.where(
      Sequelize.fn(
        "LOWER",
        Sequelize.fn("CONVERT", Sequelize.col("body"), "utf8mb4")
      ),
      {
        [Op.like]: Sequelize.fn(
          "LOWER",
          Sequelize.fn("CONVERT", normalizedTerm, "utf8mb4")
        ),
      }
    ),
  };

  // Busca mensagens no banco de dados com a condição ajustada
  const messages = await Message.findAll({
    where: whereCondition,
    order: [["id", "ASC"]],
    limit,
    offset,
  });

  return messages;
};

export default SearchMessagesService;
