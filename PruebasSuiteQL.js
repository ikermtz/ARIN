/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

var 	
	https,
	log,
	page,
	record,
	runtime,	
	scriptURL,
	url,
	version = '2021.2';


define( [ 'N/https', 'N/log', 'N/ui/message', 'N/record', 'N/runtime', 'N/ui/serverWidget', 'N/url', 'N/search'], main );


function main( httpsModule, log, messageModule, recordModule, runtimeModule, serverWidgetModule, urlModule, search, ) {

	n_log = log;
	n_search = search;
	https = httpsModule;
	message = messageModule;
	record = recordModule;
	runtime = runtimeModule;
	serverWidget = serverWidgetModule;	
	url = urlModule;
	
    return {
        crearRegistro: crearRegistro,
    	onRequest: function( context ) {     
    	
			scriptURL = url.resolveScript( { scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId, returnExternalURL: false}); 
            
    		if (context.request.method == 'POST') {   

    			n_log.debug({title: 'Consultar parametros'});
                
                var nombre = context.request.parameters.firstname;
                var apellido = context.request.parameters.lastname;
                var email = context.request.parameters.email;
				var confemail = context.request.parameters.confemail;
                n_log.debug({title: 'Nombre', details: nombre});
                n_log.debug({title: 'Apellido', details: apellido});
                n_log.debug({title: 'Email', details: email});
				n_log.debug({title: 'Confirmación email', details: confemail});

				if(email == confemail){

					var res = existenUsuarios(email);
					if(res == null){
						crearRegistro(nombre, apellido, email);
						n_log.debug({title: "Registro creado"});
					} else {
						n_log.debug({title: "Usuario existente"});
					}

				} else {
					n_log.debug({title: 'Atención',	details: 'El email y el email de confirmación no coinciden'});
					n_log.debug({title: 'Información de registro',	details: 'No se creará ningún registro nuevo'});
				}
                
                // Pantalla de inicio
                var form = crearPantallaInicio(context);
                context.response.writePage(form);

    		} else {	
    			
                // Pantalla de inicio
                var form = crearPantallaInicio(context);
                context.response.writePage(form);	

			}
        }
    }
}

function crearPantallaInicio(context){

    var form = serverWidget.createForm({title: 'SuiteQL Tables Reference'});
	var htmlField = form.addField({
		id: 'custpage_field_html',
		type: serverWidget.FieldType.INLINEHTML,
		label: 'HTML'
	});

	htmlField.defaultValue = `
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
		<script src="/ui/jquery/jquery-3.5.1.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
		${jsFunctionDataTablesExternals()}		

		<style type = "text/css"> 
			input[type="text"], input[type="search"], textarea, button {
				outline: none;
				box-shadow:none !important;
				border: 1px solid #ccc !important;
			}
			p, pre { font-size: 10pt; }
			td, th { font-size: 10pt; border: 3px; }		
			.boton {
				background-color: #0d24f7; 
				padding: 10px 20px;
				color: white;
				text-align: center;
				display: inline-block;
				font-size: 16px;
				margin-left: auto;
    			margin-right: auto;
			}
			.boton:hover {
				background-color: #939ec2;
				transition: background-color 0.2s;
				color: red;
			}			

			.registrar {
				margin-left: auto;
				margin-right: auto;
				text-align: center;
				font-family: sans-serif;
				color: #075299; 
				font-size: 16px;
			}
			a:hover {
				color: red;
			}
		</style>
		
		<table class="registrar">						
			<tr>
				<td> Nombre </td><td class="col-lg-8"><input class="form-control" id="firstname" placeholder="Nombre" name="firstname" required="true" type="text" autofocus></td>
			</tr><tr>
				<td> Apellido </td><td class="col-lg-8"><input class="form-control" id="lastname" placeholder="Apellido" name="lastname" required="true" type="text"></td>
			</tr><tr>
				<td> Email</td><td class="col-lg-8"><input class="form-control" id="email" placeholder="Email" name="email" required="true" type="email" minlength="6"></td>
			</tr><tr>
				<td> Confirmar email</td><td class="col-lg-8"><input class="form-control" id="confemail" placeholder="Confirmar email" name="confemail" required="true" type="email" minlength="6"></td>
			</tr>
			<br>
		</table>
		<table class="registrar">
			<tr>
				<td><input id="submitter" class="boton" type="submit" value="Registrar"></td>
			</tr><tr>
				<td><a href="https://2284927.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=540" target="_blank"> Ver usuarios </a></td>
			</tr><tr>
				<td><a href="https://2284927.app.netsuite.com/app/common/custom/custrecord.nl?id=540&e=T" target="_blank"> Ver información de registro </a></td>
			</tr>
			<br>
		</table>
		</style>
			
		<table style="table-layout: fixed; width: 100%; border-spacing: 6px; border-collapse: separate;">	
			<tr>
				<td width="30%" valign="top">
					<p style="color: #4d5f79; font-weight: 600;">Select a table to view its details.</p>
					<divstyle="margin-top: 3px;" id="tablesColumn">Loading Tables Index...</div>
				</td>
				<td id="tableInfoColumn" valign="top">&nbsp;</td>			
			</tr>
		</table>
		
		<script>				
			window.jQuery = window.$ = jQuery;			
			${jsFunctionTableDetailsGet()}
			${jsFunctionTableNamesGet()}
			tableNamesGet();			
		</script>`;
			
	return form;
}

function jsFunctionDataTablesExternals() {

	return `<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.css">
 			<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.js"></script>`
}

function jsFunctionTableDetailsGet() {

	return `
		function tableDetailsGet( tableName ) {
		
			document.getElementById('tableInfoColumn').innerHTML = '<h5 style="color: green;">Loading information for ' + tableName + ' table...</h5>';
			var url = '/app/recordscatalog/rcendpoint.nl?action=\getRecordTypeDetail&data=' + encodeURI( JSON.stringify( { scriptId: tableName, detailType: 'SS_ANAL' } ) );
			var xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true );
			xhr.send();

			xhr.onload = function() {	

				if( xhr.status === 200 ) {	
					let recordDetail = JSON.parse( xhr.response ).data;
					content = '<h4 style="color: #4d5f79; font-weight: 600;">' + recordDetail.label + ' ("' + tableName + '")</h4>';	
					content += '<h5 style="margin-top: 18px; margin-bottom: 6px; color: #4d5f79; font-weight: 600;">Columns</h5>';	
					content += '<div class="table-responsive">';
					content += '<table class="table table-sm table-bordered table-hover table-responsive-sm" id="tableColumnsTable">';	
					content += '<thead class="thead-light">';
					content += '<tr>';	
					content += '<th>Label</th>';	
					content += '<th>Name</th>';	
					content += '<th>Type</th>';	
					content += '</tr>';	
					content += '</thead>';
					content += '<tbody>';													
					for ( i = 0; i < recordDetail.fields.length; i++ ) {												
						var field = recordDetail.fields[i];									
						if ( field.isColumn ) {;										
							content += '<tr>';	
							content += '<td>' + field.label + '</td>';	
							content += '<td>' + field.id + '</td>';
							content += '<td>' + field.dataType + '</td>';
							content += '</tr>';									
						};												
					}		
					content += '</tbody>';					
					content += '</table>';
					content += '</div>';				

					if ( recordDetail.joins.length > 0 ) {
						content += '<h5 style="margin-top: 18px; margin-bottom: 6px; color: #4d5f79; font-weight: 600;">Joins</h5>';	
						content += '<div class="table-responsive">';
						content += '<table class="table table-sm table-bordered table-hover table-responsive-sm" id="tableJoinsTable">';
						content += '<thead class="thead-light">';
						content += '<tr>';	
						content += '<th>Label</th>';	
						content += '<th>Table Name</th>';	
						content += '<th>Cardinality</th>';
						content += '<th>Join Pairs</th>';	
						content += '</tr>';		
						content += '</thead>';
						content += '<tbody>';													
						for ( i = 0; i < recordDetail.joins.length; i++ ) {												
							var join = recordDetail.joins[i];									
							content += '<tr>';	
							content += '<td>' + join.label + '</td>';	
							content += '<td><a href="#" onclick="javascript:tableDetailsGet( \\'' + join.sourceTargetType.id + '\\' );">' + join.sourceTargetType.id + '</a></td>';
							content += '<td>' + join.cardinality + '</td>';
							var joinInfo = "";
							for ( j = 0; j < join.sourceTargetType.joinPairs.length; j++ ) {	
							var joinPair = join.sourceTargetType.joinPairs[j];
							joinInfo += joinPair.label + '<br>';
							}
							content += '<td>' + joinInfo + '</td>';
							content += '</tr>';									
						}	
						content += '</tbody>';					
						content += '</table>';	
						content += '</div>';	
					}	
					
					let textareaRows = recordDetail.fields.length + 5;
					
					content += '<h5 style="margin-top: 18px; margin-bottom: 6px; color: #4d5f79; font-weight: 600;">Sample Query</h5>';
					content += '<span style="font-size: 11pt;"><a href="#" onclick="javascript:tableQueryCopy();">Click here</a> to copy the query.</span>';
					content += '<textarea class="form-control small" id="tableQuery" name="sampleQuery" rows="' + textareaRows + '" style="font-size: 10pt;">';
					content += 'SELECT\\n';
					for ( i = 0; i < recordDetail.fields.length; i++ ) {												
						var field = recordDetail.fields[i];									
						if ( field.isColumn ) {										
							content += '\\t' + tableName + '.' + field.id;
							if ( ( i + 1 ) < recordDetail.fields.length ) { content += ','; }	
							content += '\\n';															
						}												
					}		
					content += 'FROM\\n';	
					content += '\\t' + tableName + '\\n';																
					content += '</textarea>';												
						
					document.getElementById('tableInfoColumn').innerHTML = content;		
					$('#tableColumnsTable').DataTable();
					$('#tableJoinsTable').DataTable();									
				} else {
				
					alert( 'Error: ' + xhr.status );
				}
			}			
		}`	
}

function jsFunctionTableNamesGet() {

	return `
		function tableNamesGet() {
		
			var url = '/app/recordscatalog/rcendpoint.nl?action=\getRecordTypes&data=' + encodeURI( JSON.stringify( { structureType: 'FLAT' } ) );
			var xhr = new XMLHttpRequest();
			xhr.open( 'GET', url, true );
			xhr.send();
			xhr.onload = function() {
									
				if( xhr.status === 200 ) {	
																							
					let recordTypes = JSON.parse( xhr.response ).data;
					
					content = '<div class="table-responsive">';
						content += '<table class="table table-sm table-bordered table-hover table-responsive-sm" id="tableNamesTable">';												
							content += '<thead class="thead-light">';
								content += '<tr>';
									content += '<th>Table</th>';
								content += '</tr>';
								content += '<tr>';
									content += '<td> Suggested search: customrecord_ai_estudianteshtml </td>';
								content += '</tr>';
							content += '</thead>';
							content += '<tbody>';
							for ( i = 0; i < recordTypes.length; i++ ) {	
								content += '<tr>';
									content += '<td>';
									content += '<a href="#" onclick="javascript:tableDetailsGet( \\'' + recordTypes[i].id + '\\' );" style="font-weight: bold;">' + recordTypes[i].label + '</a><br>';
									content += recordTypes[i].id;
									content += '</td>';												
								content += '</tr>';													
							}	
							content += '</tbody>';
						content += '</table>';
					content += '</div>';

					document.getElementById('tablesColumn').innerHTML = content;	
					$('#tableNamesTable').DataTable();
				
				} else {				
					alert( 'Error: ' + xhr.status );
				}
			}			
		}	
	`	
}

function crearRegistro(n, a, e){
            
    n_log.debug({title: 'Vamos a crear el registro'});
    var newEstudiante = record.create({type: 'customrecord_ai_estudianteshtml', isDynamic: true});

    n_log.debug({title:'Nombre:', details: n});
    newEstudiante.setValue({fieldId: 'name', value: n});
    n_log.debug({title:'Apellido:', details: a});
    newEstudiante.setValue({fieldId: 'custrecord_ai_esthtml_apellido', value: a});
    n_log.debug({title:'Email:', details: e});
    newEstudiante.setValue({fieldId: 'custrecord_ai_esthtml_mail', value: e});

    try { 
        newEstudiante.save();
        n_log.debug({title: 'Nuevo estudiante'});
    } catch (e) {
        n_log.debug({title: e.message});
    }

}

function existenUsuarios(email){
	var search = n_search.create({
		type: 'customrecord_ai_estudianteshtml',
		filters: ['custrecord_ai_esthtml_mail', n_search.Operator.IS, email],
		columns: [n_search.createColumn({name: 'custrecord_ai_esthtml_mail', label: 'mail'})]
	}).run().getRange({start: 0, end: 1});

	for (var row in search) return search[row].id;           
}