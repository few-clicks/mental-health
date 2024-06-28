import { Injectable } from '@nestjs/common';
import * as nano from 'nano';
import { IUser, User } from './types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CouchDbService {
  private readonly db: nano.DocumentScope<User>;

  constructor(private readonly configService: ConfigService) {
    const couch = nano(
      `http://${this.configService.get('COUCHDB_USER')}:${this.configService.get('COUCHDB_PASSWORD')}@localhost:5984`,
    );
    couch.db.list().then((body) => {
      if (!body.includes('users')) couch.db.create('users');
    });
    this.db = couch.db.use('users');
  }

  public async createUser(user: IUser): Promise<User> {
    const u = new User(user.chatId, user.emotions);
    const response = await this.db.insert(u).then((response) => {
      u.processAPIResponse(response);
      return u;
    });
    return response;
  }

  public async getUserByChatId(chatId: number): Promise<User[]> {
    const response = await this.db.find({ selector: { chatId } });
    return response.docs;
  }

  public async updateUser(u: User): Promise<User> {
    const user = await this.db.get(u._id);

    if (!user) throw new Error('User not found');

    const response = await this.db.insert(u).then((response) => {
      u.processAPIResponse(response);
      return u;
    });
    return response;
  }
}
