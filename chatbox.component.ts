import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Personnel} from '../../entities/personnel';
import {ListesderoulantesService} from '../services/listesderoulantes.service';
import {AclGuard} from '../guard/acl.guard';
import {ToolsService} from '../services/tools.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Message} from '../../entities/message';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit, OnChanges {
  messageForm: FormGroup;
  role: AclGuard;
  utilisateur: Personnel;
  mustReload = new EventEmitter();

  messageToCreate;
  isUserFound = true;

  @Output() msgAdded = new EventEmitter();
  constructor(
    private formBuilder: FormBuilder,
    private ls: ListesderoulantesService,
    private ts: ToolsService,
    private aclGuard: AclGuard,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.role = aclGuard;
  }
  @Input() id: number;
  @Input() type: string;
  @Input() messages: Message[];

  ngOnInit(): void {

    // Récupération de l'ID de l'utilisateur qui tente de poster le message.
    this.ls.getPersonnelByEmail(this.role.isCurrentUser()).subscribe(user => {
      if (user) {
        this.utilisateur = user[0];
      } else {
        this.isUserFound = false;
      }
    });
    this.messageForm = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
  }

  /**
   * Composition de l'objet du message
   */
  prepareMessage() {
    switch (this.type) {
      case 'DA': {
        this.messageToCreate = {
          corps: this.messageForm.get('message').value,
          user: this.utilisateur,
          demandeachat: {id : this.id}
        };
        break;
      }
      case 'DM': {
        this.messageToCreate = {
          corps: this.messageForm.get('message').value,
          user: this.utilisateur,
          dmandemission: {id : this.id}
        };
        break;
      }
      case 'FI': {
        this.messageToCreate = {
          corps: this.messageForm.get('message').value,
          user: this.utilisateur,
          fichefinanciere: {id : this.id}
        };
        break;
      }
      default: {
        this.snackBar.open('Une erreur est survenue.', 'Fermer', {
          duration: 4000
        });
        break;
      }
    }
  }

  /**
   * Fonction pour créer le nouveau message
   */
  ajouterMessage() {

    // Préparation du corps du message:

    this.prepareMessage();

    // POST du nouveau message:
    // Uniquement si l'objet du message est bien formaté, sinon snackbar d'erreur.
    if (Object.keys(this.messageToCreate).length !== 0 && this.isUserFound) {
      this.ts.creerMessage(this.messageToCreate).subscribe(msg => {
        this.snackBar.open('Message ajouté avec succès', 'Fermer', {
          duration: 2000
        });
        this.messageForm.reset();
        // contournement pour réinitialiser les champs surlignés en erreur suite au reset:
        Object.keys(this.messageForm.controls).forEach(key => {
          this.messageForm.controls[key].setErrors(null);
        });

        // Réponse au parent avec l'ID de l'entité mise à jour:
        this.msgAdded.emit(this.id);
      });
    } else {
      this.snackBar.open('Une erreur est survenue lors de la création du message.', 'Fermer', {
        duration: 5000
      });
    }
  }

  /**
   * Lifecycle qui sera délenché si un changement a lieu sur une des propriétés data-bindés entre père et fils.
   * @param changes: les propriétés qui ont changé.
   */
  ngOnChanges(changes: SimpleChanges): void {
      this.changeDetectorRef.detectChanges();
  }
}
